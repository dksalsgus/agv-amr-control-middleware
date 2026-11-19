import { runEvery } from "../common/utils/delay.util";
import {
  MQTT_URL,
  VENDOR_A_PUBLISH_INTERVAL_MS,
  VENDOR_A_ROBOT_COUNT,
} from "../config";
import { FaultSettings } from "../faults/fault-settings";
import { RobotFleet } from "../simulation/robot-fleet";
import { VendorAPublisher } from "./vendor-a-publisher";

export class VendorAEmulator {
  private readonly fleet = new RobotFleet("A", VENDOR_A_ROBOT_COUNT);
  private readonly publisher: VendorAPublisher;

  constructor(faults: FaultSettings) {
    this.publisher = new VendorAPublisher(MQTT_URL, this.fleet, faults);
  }

  async start() {
    this.publisher.connect();

    const dtSec = VENDOR_A_PUBLISH_INTERVAL_MS / 1000;
    await runEvery(VENDOR_A_PUBLISH_INTERVAL_MS, async () => {
      this.fleet.step(dtSec);
      await this.publisher.publishAll();
    });
  }
}
