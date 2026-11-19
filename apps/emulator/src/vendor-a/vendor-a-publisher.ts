import mqtt, { MqttClient } from "mqtt";
import { RobotFleet } from "../simulation/robot-fleet";
import { VendorAPayloadBuilder } from "./vendor-a-payload";

/**
 * 제조사 A 로봇들의 상태를 MQTT로 발행한다. QoS 1, retain 없음.
 */
export class VendorAPublisher {
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

    this.client.on("connect", () =>
      console.log(`[vendor-a] connected ${this.url}`),
    );
    this.client.on("error", (error) =>
      console.error(`[vendor-a] ${error.message}`),
    );
  }

  publishAll() {
    if (!this.client?.connected) {
      return;
    }

    const now = new Date();
    for (const robot of this.fleet.robots) {
      const topic = this.payloadBuilder.topic(robot);
      const payload = this.payloadBuilder.build(robot, now);
      this.client.publish(topic, JSON.stringify(payload), { qos: 1 });
    }
  }
}
