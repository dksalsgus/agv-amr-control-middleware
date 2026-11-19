import { ServerTCP } from "modbus-serial";
import { VENDOR_C_BASE_ADDRESS, VENDOR_C_BLOCK_SIZE } from "../config";
import { RobotFleet } from "../simulation/robot-fleet";
import { VendorCRegisterEncoder } from "./vendor-c-registers";

/**
 * 제조사 C의 Modbus TCP 서버. 집중형 컨트롤러 한 대에 차량 20대가 블록으로 나뉘어 있다(가정 A5).
 * 미들웨어는 홀딩 레지스터(FC3)를 폴링한다.
 */
export class VendorCServer {
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

    server.on("initialized", () =>
      console.log(`[vendor-c] listening :${this.port}`),
    );
    server.on("socketError", (error) =>
      console.error(`[vendor-c] ${String(error)}`),
    );
  }

  /** 시뮬레이션이 한 단계 진행된 뒤 레지스터를 다시 채운다. */
  refresh() {
    const next = new Array<number>(this.registers.length).fill(0);

    this.fleet.robots.forEach((robot, blockNo) => {
      const start = VENDOR_C_BASE_ADDRESS + VENDOR_C_BLOCK_SIZE * blockNo;
      const block = this.encoder.encode(robot, this.fleet.sampledAt);
      next.splice(start, block.length, ...block);
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
