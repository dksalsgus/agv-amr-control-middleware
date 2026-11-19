import { runEvery } from "../common/utils/delay.util";
import { FleetMqttPublisher } from "../common/mqtt/fleet-mqtt-publisher";
import {
  MQTT_URL,
  VENDOR_B_PORT,
  VENDOR_B_ROBOT_COUNT,
  VENDOR_B_STEP_INTERVAL_MS,
} from "../config";
import { FaultSettings } from "../faults/fault-settings";
import { RobotFleet } from "../simulation/robot-fleet";
import { VendorBPayloadBuilder } from "./vendor-b-payload";
import { VendorBServer } from "./vendor-b-server";

/** 제조사 B는 REST로 답하고, 같은 상태를 MQTT로도 발행한다(연결 설정에서 프로토콜을 바꿔 시연). */
export class VendorBEmulator {
  private readonly fleet = new RobotFleet("B", VENDOR_B_ROBOT_COUNT);
  private readonly server: VendorBServer;
  private readonly publisher: FleetMqttPublisher;

  constructor(private readonly faults: FaultSettings) {
    this.server = new VendorBServer(VENDOR_B_PORT, this.fleet, faults);
    this.publisher = new FleetMqttPublisher(
      MQTT_URL,
      "emulator-vendor-b",
      "B",
      this.fleet,
      faults,
      new VendorBPayloadBuilder(),
    );
  }

  async start() {
    this.server.refresh();
    this.server.listen();
    this.publisher.connect();

    const dtSec = VENDOR_B_STEP_INTERVAL_MS / 1000;
    await runEvery(VENDOR_B_STEP_INTERVAL_MS, async () => {
      this.fleet.step(dtSec, this.faults.robotErrors);
      this.server.refresh();
      await this.publisher.publishAll();
    });
  }
}
