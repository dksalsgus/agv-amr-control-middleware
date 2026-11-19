import { runEvery } from "../common/utils/delay.util";
import {
  VENDOR_B_PORT,
  VENDOR_B_ROBOT_COUNT,
  VENDOR_B_STEP_INTERVAL_MS,
} from "../config";
import { RobotFleet } from "../simulation/robot-fleet";
import { VendorBServer } from "./vendor-b-server";

export class VendorBEmulator {
  private readonly fleet = new RobotFleet("B", VENDOR_B_ROBOT_COUNT);
  private readonly server = new VendorBServer(VENDOR_B_PORT, this.fleet);

  async start() {
    this.server.listen();

    const dtSec = VENDOR_B_STEP_INTERVAL_MS / 1000;
    await runEvery(VENDOR_B_STEP_INTERVAL_MS, async () => {
      this.fleet.step(dtSec);
    });
  }
}
