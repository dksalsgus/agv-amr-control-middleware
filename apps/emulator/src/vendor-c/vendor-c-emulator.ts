import { runEvery } from "../common/utils/delay.util";
import {
  VENDOR_C_PORT,
  VENDOR_C_ROBOT_COUNT,
  VENDOR_C_STEP_INTERVAL_MS,
} from "../config";
import { RobotFleet } from "../simulation/robot-fleet";
import { VendorCServer } from "./vendor-c-server";

/** 제조사 C: 로봇을 움직이고 Modbus 레지스터를 다시 채운다. */
export class VendorCEmulator {
  private readonly fleet = new RobotFleet("C", VENDOR_C_ROBOT_COUNT);
  private readonly server = new VendorCServer(VENDOR_C_PORT, this.fleet);

  async start() {
    this.server.refresh();
    this.server.listen();

    const dtSec = VENDOR_C_STEP_INTERVAL_MS / 1000;
    await runEvery(VENDOR_C_STEP_INTERVAL_MS, async () => {
      this.fleet.step(dtSec);
      this.server.refresh();
    });
  }
}
