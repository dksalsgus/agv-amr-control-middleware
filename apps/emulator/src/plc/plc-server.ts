import { ServerTCP } from "modbus-serial";
import { rollPct } from "../common/utils/chance.util";
import { FaultSettings } from "../faults/fault-settings";
import { ModbusReadCallback } from "../faults/modbus-read.types";
import { PolledFaultPicker } from "../faults/polled-fault-picker";
import { PlcRegisterEncoder } from "./plc-registers";
import { PlcSimulator } from "./plc-simulator";
import { Logger } from "../common/logger/logger";
import { PLC_POINT_COUNT } from "../config";

/**
 * PLC Modbus TCP 서버. 입력 레지스터(FC4) 0~5로 상태를 읽고, 코일(FC5) 0~15로 점 값을 쓴다.
 * 코일 쓰기는 관제에서 인터록 신호를 켜고 끄는 데 쓴다. 쓴 값은 다음 읽기의 비트에 그대로 나온다.
 */
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
        getCoil: (
          address: number,
          _unitId: number,
          callback: (error: Error | null, value: boolean) => void,
        ) => this.readCoil(address, callback),
        setCoil: (
          address: number,
          value: boolean,
          _unitId: number,
          callback: (error: Error | null) => void,
        ) => this.writeCoil(address, value, callback),
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

  private readCoil(
    address: number,
    callback: (error: Error | null, value: boolean) => void,
  ) {
    if (!this.isPoint(address)) {
      callback(new Error(`unknown point ${address}`), false);
      return;
    }
    callback(null, this.plc.points[address]);
  }

  /** 끊김 장애 중에는 읽기처럼 답하지 않는다. */
  private writeCoil(
    address: number,
    value: boolean,
    callback: (error: Error | null) => void,
  ) {
    if (this.faults.get("PLC").disconnected) {
      return;
    }
    if (!this.isPoint(address)) {
      callback(new Error(`unknown point ${address}`));
      return;
    }

    // seq가 오르는 다음 step에서 읽기에 나온다. 여기서 바로 refresh하면 같은 seq로 값만 달라진다.
    this.plc.points[address] = value;
    this.logger.log(`코일 쓰기: 점 ${address} ${value ? "ON" : "OFF"}`);
    callback(null);
  }

  private isPoint(address: number): boolean {
    return (
      Number.isInteger(address) && address >= 0 && address < PLC_POINT_COUNT
    );
  }

  private slice(registers: number[], address: number, length: number) {
    const values = registers.slice(address, address + length);
    while (values.length < length) {
      values.push(0);
    }

    return values;
  }
}
