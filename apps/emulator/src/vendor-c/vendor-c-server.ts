import { ServerTCP } from "modbus-serial";
import { rollPct } from "../common/utils/chance.util";
import { FaultSettings } from "../faults/fault-settings";
import { ModbusReadCallback } from "../faults/modbus-read.types";
import { PolledFaultPicker } from "../faults/polled-fault-picker";
import { VENDOR_C_BASE_ADDRESS, VENDOR_C_BLOCK_SIZE } from "../config";
import { RobotFleet } from "../simulation/robot-fleet";
import { VendorCRegisterEncoder } from "./vendor-c-registers";
import { Logger } from "../common/logger/logger";

/** 제조사 C Modbus TCP 서버. 컨트롤러 한 대의 홀딩 레지스터(FC3)에 차량별 블록을 둔다. */
export class VendorCServer {
  private readonly logger = new Logger("vendor-c");
  private readonly encoder = new VendorCRegisterEncoder();
  private readonly picker = new PolledFaultPicker<number[]>();
  private readonly size: number;

  constructor(
    private readonly port: number,
    private readonly fleet: RobotFleet,
    private readonly faults: FaultSettings,
  ) {
    this.size =
      VENDOR_C_BASE_ADDRESS + VENDOR_C_BLOCK_SIZE * fleet.robots.length;
  }

  listen() {
    const server = new ServerTCP(
      {
        getMultipleHoldingRegisters: (
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

  refresh() {
    const next = new Array<number>(this.size).fill(0);

    this.fleet.robots.forEach((robot, blockNo) => {
      const start = VENDOR_C_BASE_ADDRESS + VENDOR_C_BLOCK_SIZE * blockNo;
      const block = this.encoder.encode(robot, this.fleet.sampledAt);
      block.forEach((word, offset) => {
        next[start + offset] = word;
      });
    });

    this.picker.push(this.fleet.sampledAt, next);
  }

  /** 끊김은 답하지 않아 상대가 타임아웃되게 하고, 유실은 예외 응답으로 답한다. */
  private read(address: number, length: number, callback: ModbusReadCallback) {
    const fault = this.faults.get("C");
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
