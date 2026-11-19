import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import mqtt, { MqttClient } from "mqtt";
import { delay } from "../../common/utils/delay.util";

export type MqttRawMessage = {
  topic: string;
  payload: Buffer;
};

export type MqttSubscribeOptions = {
  url: string;
  topic: string;
  qos: 0 | 1 | 2;
  username: string | null;
  password: string | null;
};

export type MqttHandlers = {
  onMessage: (message: MqttRawMessage) => Promise<void>;
  onLinkChange: (up: boolean) => Promise<void>;
};

const MIN_RETRY_MS = 1000;
const MAX_RETRY_MS = 10000;

/**
 * 연결마다 MQTT 클라이언트 하나. 재접속 때 지난 메시지가 몰리지 않게 세션을 두지 않는다.
 * 재접속 간격을 늘리려고 자동 재접속을 끄고 직접 1초부터 두 배씩(최대 10초) 다시 붙는다.
 */
@Injectable()
export class MqttClientRepository implements OnModuleDestroy {
  private readonly logger = new Logger(MqttClientRepository.name);
  private readonly clients = new Map<string, MqttClient>();
  private readonly retryDelays = new Map<string, number>();
  private stopping = false;

  async subscribe(
    connectionId: string,
    options: MqttSubscribeOptions,
    handlers: MqttHandlers,
  ): Promise<void> {
    const client = mqtt.connect(options.url, {
      clientId: `middleware-${connectionId}`,
      clean: true,
      reconnectPeriod: 0,
      username: options.username ?? undefined,
      password: options.password ?? undefined,
    });

    client.on("connect", async () => {
      this.retryDelays.set(connectionId, MIN_RETRY_MS);
      await handlers.onLinkChange(true);
      await this.handleConnect(client, connectionId, options);
    });
    client.on("close", async () => {
      if (!(await this.isActive(connectionId, client))) {
        return;
      }

      await handlers.onLinkChange(false);
      await this.reconnectLater(client, connectionId);
    });
    client.on("error", (error) => {
      this.logger.warn(`${connectionId}: ${error.message}`);
    });
    client.on("message", async (topic, payload) => {
      await handlers.onMessage({ topic, payload });
    });

    this.clients.set(connectionId, client);
  }

  /** 구독을 끝내고 접속을 닫는다. 끊김으로 보지 않는다. */
  async unsubscribe(connectionId: string): Promise<void> {
    const client = this.clients.get(connectionId);
    if (!client) {
      return;
    }

    this.clients.delete(connectionId);
    this.retryDelays.delete(connectionId);
    await client.endAsync();
  }

  async onModuleDestroy() {
    this.stopping = true;

    const closing = [...this.clients.values()].map((client) =>
      client.endAsync(),
    );
    await Promise.all(closing);
  }

  /** 내려간 클라이언트(앱 종료, 구독 해제, 재시작으로 교체)의 이벤트는 무시한다. */
  private async isActive(
    connectionId: string,
    client: MqttClient,
  ): Promise<boolean> {
    return !this.stopping && this.clients.get(connectionId) === client;
  }

  private async reconnectLater(
    client: MqttClient,
    connectionId: string,
  ): Promise<void> {
    const delayMs = this.retryDelays.get(connectionId) ?? MIN_RETRY_MS;
    this.retryDelays.set(connectionId, Math.min(delayMs * 2, MAX_RETRY_MS));

    await delay(delayMs);
    if (await this.isActive(connectionId, client)) {
      client.reconnect();
    }
  }

  /** 세션을 유지하지 않으므로 접속할 때마다 다시 구독한다. */
  private async handleConnect(
    client: MqttClient,
    connectionId: string,
    options: MqttSubscribeOptions,
  ): Promise<void> {
    this.logger.log(`connected ${options.url} (${connectionId})`);

    try {
      await client.subscribeAsync(options.topic, { qos: options.qos });
    } catch (error) {
      this.logger.warn(`구독 실패 (${connectionId}): ${String(error)}`);
    }
  }
}
