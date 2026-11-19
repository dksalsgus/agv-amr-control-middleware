import mqtt, { MqttClient } from "mqtt";
import { rollPct } from "../utils/chance.util";
import { FaultSettings } from "../../faults/fault-settings";
import { FaultGroup } from "../../faults/fault.types";
import { Robot } from "../../simulation/robot";
import { RobotFleet } from "../../simulation/robot-fleet";
import { Logger } from "../logger/logger";

/** 로봇 한 대를 MQTT 토픽과 본문으로 만드는 제조사별 형식 */
export type FleetPayloadBuilder = {
  topic(robot: Robot): string;
  build(robot: Robot, now: Date): object;
};

/** 로봇 묶음의 상태를 MQTT로 발행한다(QoS 1, retain 없음). 장애는 group 설정을 따른다. */
export class FleetMqttPublisher {
  /** 뒤바뀐 메시지는 다음 주기 발행(1초 뒤)보다 늦게 나가도록 이만큼 더 늦춘다. */
  private static readonly REORDER_EXTRA_DELAY_MS = 1500;

  private readonly logger: Logger;
  private client: MqttClient | null = null;

  constructor(
    private readonly url: string,
    private readonly clientId: string,
    private readonly group: FaultGroup,
    private readonly fleet: RobotFleet,
    private readonly faults: FaultSettings,
    private readonly payloadBuilder: FleetPayloadBuilder,
  ) {
    this.logger = new Logger(clientId);
  }

  connect() {
    this.client = mqtt.connect(this.url, {
      clientId: this.clientId,
      reconnectPeriod: 1000,
    });

    this.client.on("connect", () => this.logger.log(`connected ${this.url}`));
    this.client.on("error", (error) => this.logger.error(`${error.message}`));
  }

  /**
   * 모든 로봇을 발행하고 브로커 응답(PUBACK)까지 기다린다.
   * 장애: 끊김은 발행을 멈추고, 유실은 건너뛰고, 중복은 두 번 보낸다.
   * 지연과 뒤바뀜은 발생 시각(ts)은 그대로 두고 보내는 때만 늦춘다.
   */
  async publishAll() {
    const client = this.client;
    const fault = this.faults.get(this.group);
    if (!client?.connected || fault.disconnected) {
      return;
    }

    const now = new Date();
    const publishing: Promise<void>[] = [];
    for (const robot of this.fleet.robots) {
      if (rollPct(fault.lossPct)) {
        continue;
      }

      const topic = this.payloadBuilder.topic(robot);
      const payload = JSON.stringify(this.payloadBuilder.build(robot, now));
      const isReordered = rollPct(fault.reorderPct);
      const delayMs =
        fault.delayMs +
        (isReordered ? FleetMqttPublisher.REORDER_EXTRA_DELAY_MS : 0);
      publishing.push(this.publish(client, topic, payload, delayMs));
      if (rollPct(fault.duplicatePct)) {
        publishing.push(this.publish(client, topic, payload, delayMs));
      }
    }

    const results = await Promise.allSettled(publishing);
    const failure = results.find((result) => result.status === "rejected");
    if (failure) {
      this.logger.error(`발행 실패: ${String(failure.reason)}`);
    }
  }

  /** 늦출 때는 기다리지 않고 예약만 한다. 다음 주기 발행이 밀리면 안 되기 때문이다. */
  private async publish(
    client: MqttClient,
    topic: string,
    payload: string,
    delayMs: number,
  ): Promise<void> {
    if (delayMs === 0) {
      await client.publishAsync(topic, payload, { qos: 1 });
      return;
    }

    setTimeout(() => {
      client
        .publishAsync(topic, payload, { qos: 1 })
        .catch((error: unknown) => {
          this.logger.error(`지연 발행 실패: ${String(error)}`);
        });
    }, delayMs);
  }
}
