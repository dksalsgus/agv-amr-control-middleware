import { Injectable } from "@nestjs/common";
import { RobotOpState } from "../../state/robot-state";
import { ModbusRawMessage } from "../providers/modbus-link.provider";
import { RobotReading, VendorAdapter } from "./vendor-adapter";

const UINT16 = 0x10000;

const OP_STATE_BY_CODE: RobotOpState[] = [
  "IDLE",
  "MOVING",
  "CHARGING",
  "PAUSED",
  "ERROR",
];

const toInt16 = (value: number) => (value >= 0x8000 ? value - UINT16 : value);

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
    const readings: RobotReading[] = [];

    for (let index = 0; index < blockCount; index += 1) {
      const start = index * raw.blockSize;
      const block = raw.registers.slice(start, start + raw.blockSize);
      readings.push(this.toReading(raw.firstBlock + index, block));
    }

    return readings;
  }

  private toReading(blockNo: number, block: number[]): RobotReading {
    const seq = block[0] * UINT16 + block[1];
    const sourceMs = block[2] * UINT16 * UINT16 + block[3] * UINT16 + block[4];
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
