import { runEvery } from "../common/utils/delay.util";
import {
  MQTT_URL,
  VENDOR_A_PUBLISH_INTERVAL_MS,
  VENDOR_A_ROBOT_COUNT,
} from "../config";
import { FaultSettings } from "../faults/fault-settings";
import { RobotFleet } from "../simulation/robot-fleet";
import { FleetMqttPublisher } from "../common/mqtt/fleet-mqtt-publisher";
import { VendorAPayloadBuilder } from "./vendor-a-payload";

export class VendorAEmulator {
  private readonly fleet = new RobotFleet("A", VENDOR_A_ROBOT_COUNT);
  private readonly publisher: FleetMqttPublisher;

  constructor(private readonly faults: FaultSettings) {
    this.publisher = new FleetMqttPublisher(
      MQTT_URL,
      "emulator-vendor-a",
      "A",
      this.fleet,
      faults,
      new VendorAPayloadBuilder(),
    );
  }

  async start() {
    this.publisher.connect();

    const dtSec = VENDOR_A_PUBLISH_INTERVAL_MS / 1000;
    await runEvery(VENDOR_A_PUBLISH_INTERVAL_MS, async () => {
      this.fleet.step(dtSec, this.faults.robotErrors);
      await this.publisher.publishAll();
    });
  }
}
