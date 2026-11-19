import { toUint32Words, toUint48Words } from "../common/utils/register.util";
import { PlcSimulator } from "./plc-simulator";

/**
 * PLC 상태 → 입력 레지스터 6개: 0 점 16개(비트), 1~2 seq, 3~5 시각(ms).
 * 값과 seq를 한 요청으로 읽도록 코일 대신 워드에 담는다.
 */
export class PlcRegisterEncoder {
  encode(plc: PlcSimulator, sampledAt: Date): number[] {
    const ms = sampledAt.getTime();

    return [
      this.toWord(plc.points),
      ...toUint32Words(plc.seq),
      ...toUint48Words(ms),
    ];
  }

  private toWord(points: boolean[]): number {
    return points.reduce(
      (word, value, pointNo) => (value ? word | (1 << pointNo) : word),
      0,
    );
  }
}
