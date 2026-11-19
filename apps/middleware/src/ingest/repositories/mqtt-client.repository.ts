import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import mqtt, { MqttClient } from "mqtt";

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

/**
 * 연결(vendors_connections 행)마다 MQTT 클라이언트 하나를 둔다.
 * 세션은 유지하지 않는다: 재접속 때 지난 위치가 몰려오지 않게 한다(설계 문서 8장).
 */
@Injectable()
export class MqttClientRepository implements OnModuleDestroy {
  private readonly logger = new Logger(MqttClientRepository.name);
  private readonly clients = new Map<string, MqttClient>();

  subscribe(
    connectionId: string,
    options: MqttSubscribeOptions,
    onMessage: (message: MqttRawMessage) => void,
  ) {
    const client = mqtt.connect(options.url, {
      clientId: `middleware-${connectionId}`,
      clean: true,
      reconnectPeriod: 1000,
      username: options.username ?? undefined,
      password: options.password ?? undefined,
    });

    client.on("connect", () => {
      this.logger.log(`connected ${options.url} (${connectionId})`);
      client.subscribe(options.topic, { qos: options.qos });
    });
    client.on("error", (error) => {
      this.logger.warn(`${connectionId}: ${error.message}`);
    });
    client.on("message", (topic, payload) => {
      onMessage({ topic, payload });
    });

    this.clients.set(connectionId, client);
  }

  async onModuleDestroy() {
    const closing = [...this.clients.values()].map((client) =>
      client.endAsync(),
    );
    await Promise.all(closing);
  }
}
