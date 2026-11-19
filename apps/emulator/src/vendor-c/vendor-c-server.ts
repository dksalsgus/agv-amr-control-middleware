import { ServerTCP } from "modbus-serial";
import { VENDOR_C_BASE_ADDRESS, VENDOR_C_BLOCK_SIZE } from "../config";
import { RobotFleet } from "../simulation/robot-fleet";
import { VendorCRegisterEncoder } from "./vendor-c-registers";
import { Logger } from "../common/logger/logger";

/** 제조사 C Modbus TCP 서버. 컨트롤러 한 대의 홀딩 레지스터(FC3)에 차량별 블록을 둔다. */
export class VendorCServer {
  private readonly logger = new Logger("vendor-c");
  private readonly encoder = new VendorCRegisterEncoder();
  private registers: number[];

  constructor(
    private readonly port: number,
    private readonly fleet: RobotFleet,
  ) {
    const size =
      VENDOR_C_BASE_ADDRESS + VENDOR_C_BLOCK_SIZE * fleet.robots.length;
    this.registers = new Array<number>(size).fill(0);
  }

  listen() {
    const server = new ServerTCP(
      {
        getMultipleHoldingRegisters: (address: number, length: number) =>
          this.read(address, length),
      },
      { host: "0.0.0.0", port: this.port, unitID: 1 },
    );

    server.on("initialized", () => this.logger.log(`listening :${this.port}`));
    server.on("socketError", (error) => this.logger.error(`${String(error)}`));
  }

  refresh() {
    const next = new Array<number>(this.registers.length).fill(0);

    this.fleet.robots.forEach((robot, blockNo) => {
      const start = VENDOR_C_BASE_ADDRESS + VENDOR_C_BLOCK_SIZE * blockNo;
      const block = this.encoder.encode(robot, this.fleet.sampledAt);
      block.forEach((word, offset) => {
        next[start + offset] = word;
      });
    });

    this.registers = next;
  }

  private read(address: number, length: number): number[] {
    const values = this.registers.slice(address, address + length);
    while (values.length < length) {
      values.push(0);
    }

    return values;
  }
}
