import { Injectable } from "@nestjs/common";
import { toInt16, toUint32, toUint48 } from "../../common/utils/register.util";
import { RobotOpState } from "../../state/robot-state";
import { ModbusRawMessage } from "../providers/modbus-link.provider";
import { RobotReading, VendorAdapter } from "./vendor-adapter";

const OP_STATE_BY_CODE: RobotOpState[] = [
  "IDLE",
  "MOVING",
  "CHARGING",
  "PAUSED",
  "ERROR",
];

/**
 * 제조사 C: Modbus 레지스터 블록(차량당 16개).
 * +0~1 seq(uint32), +2~4 발생 시각(uint48 ms), +5~6 x·y(int16 cm), +7 방향(0.1도),
 * +8 속도(cm/s), +9 배터리(%), +10 상태(0~4), +11 오류 코드(0이면 없음), +12 비트0 적재
 */
@Injectable()
export class VendorCAdapter implements VendorAdapter<ModbusRawMessage> {
  readonly vendorCode = "VENDOR_C";

  toCommon(raw: ModbusRawMessage): RobotReading[] {
    const blockCount = Math.floor(raw.registers.length / raw.blockSize);
    return Array.from({ length: blockCount }, (_, index) => {
      const start = index * raw.blockSize;
      const block = raw.registers.slice(start, start + raw.blockSize);
      return this.toReading(raw.firstBlock + index, block);
    });
  }

  private toReading(blockNo: number, block: number[]): RobotReading {
    const seq = toUint32(block[0], block[1]);
    const sourceMs = toUint48(block[2], block[3], block[4]);
    const errorCode = block[11];

    return {
      externalId: String(blockNo),
      seq,
      sourceTs: new Date(sourceMs),
      x: toInt16(block[5]) / 100,
      y: toInt16(block[6]) / 100,
      theta: block[7] / 10,
      speed: block[8] / 100,
      batteryPct: block[9],
      opState: OP_STATE_BY_CODE[block[10]] ?? "ERROR",
      errorCode: errorCode === 0 ? null : String(errorCode),
      loaded: (block[12] & 1) === 1,
    };
  }
}
