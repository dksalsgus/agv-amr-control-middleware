import { Injectable } from "@nestjs/common";
import { toInt16, toUint32, toUint48 } from "../../common/utils/register.util";
import { RobotOpState } from "../../state/robot-state";
import { ModbusRawMessage } from "../providers/device-transport.types";
import { RobotReading, VendorAdapter } from "./vendor-adapter";

/**
 * 제조사 C: 차량당 레지스터 16개
 * +0~1 seq, +2~4 시각(ms), +5~6 x·y(cm), +7 방향(0.1도), +8 속도(cm/s),
 * +9 배터리, +10 상태, +11 오류 코드, +12 비트0 적재
 */
@Injectable()
export class VendorCAdapter implements VendorAdapter<ModbusRawMessage> {
  private static readonly OP_STATE_BY_CODE: RobotOpState[] = [
    "IDLE",
    "MOVING",
    "CHARGING",
    "PAUSED",
    "ERROR",
  ];

  readonly vendorCode = "VENDOR_C";

  async toCommon(raw: ModbusRawMessage): Promise<RobotReading[]> {
    const blockCount = Math.floor(raw.registers.length / raw.blockSize);
    const blockIndexes = Array.from({ length: blockCount }, (_, i) => i);

    const readings: RobotReading[] = [];
    for (const index of blockIndexes) {
      const start = index * raw.blockSize;
      const block = raw.registers.slice(start, start + raw.blockSize);
      readings.push(this.toReading(raw.firstBlock + index, block));
    }

    return readings;
  }

  private toReading(blockNo: number, block: number[]): RobotReading {
    const errorCode = block[11];

    return {
      externalId: String(blockNo),
      seq: toUint32(block[0], block[1]),
      sourceTs: new Date(toUint48(block[2], block[3], block[4])),
      x: toInt16(block[5]) / 100,
      y: toInt16(block[6]) / 100,
      theta: block[7] / 10,
      speed: block[8] / 100,
      batteryPct: block[9],
      opState: VendorCAdapter.OP_STATE_BY_CODE[block[10]] ?? "ERROR",
      errorCode: errorCode === 0 ? null : String(errorCode),
      loaded: (block[12] & 1) === 1,
    };
  }
}
