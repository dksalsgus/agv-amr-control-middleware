import { runEvery } from "../common/utils/delay.util";
import { PLC_PORT, PLC_STEP_INTERVAL_MS } from "../config";
import { FaultSettings } from "../faults/fault-settings";
import { PlcServer } from "./plc-server";
import { PlcSimulator } from "./plc-simulator";

export class PlcEmulator {
  private readonly plc = new PlcSimulator();
  private readonly server: PlcServer;

  constructor(faults: FaultSettings) {
    this.server = new PlcServer(PLC_PORT, this.plc, faults);
  }

  async start() {
    this.server.refresh(new Date());
    this.server.listen();

    await runEvery(PLC_STEP_INTERVAL_MS, async () => {
      this.plc.step();
      this.server.refresh(new Date());
    });
  }
}
