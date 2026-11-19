import { Injectable } from "@nestjs/common";
import { toUint32, toUint48 } from "../../common/utils/register.util";
import { ModbusRawMessage } from "../providers/modbus-link.provider";

/** PLC 신호의 공통 모델. 16점을 한 번에 읽으므로 seq와 시각을 함께 든다. */
export type PlcReading = {
  externalId: string;
  seq: number;
  sourceTs: Date;
  values: boolean[];
};

const POINT_COUNT = 16;

/**
 * PLC: 입력 레지스터 6개 (설계 문서 4장 PLC 매핑표).
 * 0: 점 16개(비트 0~15), 1~2: seq(uint32), 3~5: 발생 시각(uint48 ms)
 */
@Injectable()
export class PlcAdapter {
  toCommon(raw: ModbusRawMessage): PlcReading {
    const registers = raw.registers;

    return {
      externalId: String(raw.firstBlock),
      seq: toUint32(registers[1], registers[2]),
      sourceTs: new Date(toUint48(registers[3], registers[4], registers[5])),
      values: this.toBits(registers[0]),
    };
  }

  private toBits(word: number): boolean[] {
    return Array.from(
      { length: POINT_COUNT },
      (_, pointNo) => (word & (1 << pointNo)) !== 0,
    );
  }
}
