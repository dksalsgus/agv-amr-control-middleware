import { runEvery } from "../common/utils/delay.util";
import {
  VENDOR_C_PORT,
  VENDOR_C_ROBOT_COUNT,
  VENDOR_C_STEP_INTERVAL_MS,
} from "../config";
import { FaultSettings } from "../faults/fault-settings";
import { RobotFleet } from "../simulation/robot-fleet";
import { VendorCServer } from "./vendor-c-server";

export class VendorCEmulator {
  private readonly fleet = new RobotFleet("C", VENDOR_C_ROBOT_COUNT);
  private readonly server: VendorCServer;

  constructor(private readonly faults: FaultSettings) {
    this.server = new VendorCServer(VENDOR_C_PORT, this.fleet, faults);
  }

  async start() {
    this.server.refresh();
    this.server.listen();

    const dtSec = VENDOR_C_STEP_INTERVAL_MS / 1000;
    await runEvery(VENDOR_C_STEP_INTERVAL_MS, async () => {
      this.fleet.step(dtSec, this.faults.robotErrors);
      this.server.refresh();
    });
  }
}
