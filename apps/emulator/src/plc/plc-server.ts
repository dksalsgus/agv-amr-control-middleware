import { ServerTCP } from "modbus-serial";
import { rollPct } from "../common/utils/chance.util";
import { FaultSettings } from "../faults/fault-settings";
import { ModbusReadCallback } from "../faults/modbus-read.types";
import { PolledFaultPicker } from "../faults/polled-fault-picker";
import { PlcRegisterEncoder } from "./plc-registers";
import { PlcSimulator } from "./plc-simulator";
import { Logger } from "../common/logger/logger";

/** PLC Modbus TCP 서버. 입력 레지스터(FC4) 0~5를 제공한다. */
export class PlcServer {
  private readonly logger = new Logger("plc");
  private readonly encoder = new PlcRegisterEncoder();
  private readonly picker = new PolledFaultPicker<number[]>();

  constructor(
    private readonly port: number,
    private readonly plc: PlcSimulator,
    private readonly faults: FaultSettings,
  ) {}

  listen() {
    const server = new ServerTCP(
      {
        getMultipleInputRegisters: (
          address: number,
          length: number,
          _unitId: number,
          callback: ModbusReadCallback,
        ) => this.read(address, length, callback),
      },
      { host: "0.0.0.0", port: this.port, unitID: 1 },
    );

    server.on("initialized", () => this.logger.log(`listening :${this.port}`));
    server.on("socketError", (error) => this.logger.error(`${String(error)}`));
  }

  refresh(sampledAt: Date) {
    this.picker.push(sampledAt, this.encoder.encode(this.plc, sampledAt));
  }

  /** 끊김은 답하지 않아 상대가 타임아웃되게 하고, 유실은 예외 응답으로 답한다. */
  private read(address: number, length: number, callback: ModbusReadCallback) {
    const fault = this.faults.get("PLC");
    if (fault.disconnected) {
      return;
    }
    if (rollPct(fault.lossPct)) {
      callback(new Error("loss"), []);
      return;
    }

    const registers = this.picker.pick(fault, Date.now()) ?? [];
    callback(null, this.slice(registers, address, length));
  }

  private slice(registers: number[], address: number, length: number) {
    const values = registers.slice(address, address + length);
    while (values.length < length) {
      values.push(0);
    }

    return values;
  }
}
