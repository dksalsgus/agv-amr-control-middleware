import { Injectable } from "@nestjs/common";
import { toUint32, toUint48 } from "../../common/utils/register.util";
import { ModbusRawMessage } from "../providers/modbus-link.provider";

/** PLC 신호 공통 모델. 16점을 한 번에 읽어 seq와 시각을 함께 든다. */
export type PlcReading = {
  externalId: string;
  seq: number;
  sourceTs: Date;
  values: boolean[];
};

const POINT_COUNT = 16;

/** PLC: 입력 레지스터 0 점 16개(비트), 1~2 seq, 3~5 시각(ms) */
@Injectable()
export class PlcAdapter {
  async toCommon(raw: ModbusRawMessage): Promise<PlcReading> {
    const registers = raw.registers;

    return {
      externalId: String(raw.firstBlock),
      seq: toUint32(registers[1], registers[2]),
      sourceTs: new Date(toUint48(registers[3], registers[4], registers[5])),
      values: await this.toBits(registers[0]),
    };
  }

  private async toBits(word: number): Promise<boolean[]> {
    return Array.from(
      { length: POINT_COUNT },
      (_, pointNo) => (word & (1 << pointNo)) !== 0,
    );
  }
}
