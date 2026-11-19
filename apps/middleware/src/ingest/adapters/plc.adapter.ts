import { Injectable } from "@nestjs/common";
import { toUint32, toUint48 } from "../../common/utils/register.util";
import { ModbusRawMessage } from "../providers/device-transport.types";
import { PlcReading } from "./plc.types";

/** PLC: 입력 레지스터 0 점 16개(비트), 1~2 seq, 3~5 시각(ms) */
@Injectable()
export class PlcAdapter {
  private static readonly POINT_COUNT = 16;

  async toCommon(raw: ModbusRawMessage): Promise<PlcReading> {
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
      { length: PlcAdapter.POINT_COUNT },
      (_, pointNo) => (word & (1 << pointNo)) !== 0,
    );
  }
}
