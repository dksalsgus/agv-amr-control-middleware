import { runEvery } from "../common/utils/delay.util";
import { PLC_PORT, PLC_STEP_INTERVAL_MS } from "../config";
import { PlcServer } from "./plc-server";
import { PlcSimulator } from "./plc-simulator";

/** PLC: 점을 바꾸고 Modbus 입력 레지스터를 다시 채운다. */
export class PlcEmulator {
  private readonly plc = new PlcSimulator();
  private readonly server = new PlcServer(PLC_PORT, this.plc);

  async start() {
    this.server.refresh(new Date());
    this.server.listen();

    await runEvery(PLC_STEP_INTERVAL_MS, async () => {
      this.plc.step();
      this.server.refresh(new Date());
    });
  }
}
