import { ServerTCP } from "modbus-serial";
import { PlcRegisterEncoder } from "./plc-registers";
import { PlcSimulator } from "./plc-simulator";

/**
 * PLC의 Modbus TCP 서버. 미들웨어는 입력 레지스터(FC4) 0~5를 500ms마다 폴링한다.
 */
export class PlcServer {
  private readonly encoder = new PlcRegisterEncoder();
  private registers: number[] = [];

  constructor(
    private readonly port: number,
    private readonly plc: PlcSimulator,
  ) {}

  listen() {
    const server = new ServerTCP(
      {
        getMultipleInputRegisters: (address: number, length: number) =>
          this.read(address, length),
      },
      { host: "0.0.0.0", port: this.port, unitID: 1 },
    );

    server.on("initialized", () =>
      console.log(`[plc] listening :${this.port}`),
    );
    server.on("socketError", (error) =>
      console.error(`[plc] ${String(error)}`),
    );
  }

  refresh(sampledAt: Date) {
    this.registers = this.encoder.encode(this.plc, sampledAt);
  }

  private read(address: number, length: number): number[] {
    const values = this.registers.slice(address, address + length);
    while (values.length < length) {
      values.push(0);
    }

    return values;
  }
}
