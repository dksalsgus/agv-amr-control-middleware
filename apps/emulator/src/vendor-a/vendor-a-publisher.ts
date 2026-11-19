import mqtt, { MqttClient } from "mqtt";
import { RobotFleet } from "../simulation/robot-fleet";
import { VendorAPayloadBuilder } from "./vendor-a-payload";
import { Logger } from "../common/logger/logger";

/** 제조사 A 상태를 MQTT로 발행한다(QoS 1, retain 없음). */
export class VendorAPublisher {
  private readonly logger = new Logger("vendor-a");
  private readonly payloadBuilder = new VendorAPayloadBuilder();
  private client: MqttClient | null = null;

  constructor(
    private readonly url: string,
    private readonly fleet: RobotFleet,
  ) {}

  connect() {
    this.client = mqtt.connect(this.url, {
      clientId: "emulator-vendor-a",
      reconnectPeriod: 1000,
    });

    this.client.on("connect", () => this.logger.log(`connected ${this.url}`));
    this.client.on("error", (error) => this.logger.error(`${error.message}`));
  }

  /** 모든 로봇을 발행하고 브로커 응답(PUBACK)까지 기다린다. */
  async publishAll() {
    const client = this.client;
    if (!client?.connected) {
      return;
    }

    const now = new Date();
    const publishing = this.fleet.robots.map((robot) =>
      client.publishAsync(
        this.payloadBuilder.topic(robot),
        JSON.stringify(this.payloadBuilder.build(robot, now)),
        { qos: 1 },
      ),
    );

    const results = await Promise.allSettled(publishing);
    const failure = results.find((result) => result.status === "rejected");
    if (failure) {
      this.logger.error(`발행 실패: ${String(failure.reason)}`);
    }
  }
}
