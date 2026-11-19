import { PlcSimulator } from "./plc-simulator";

const UINT16 = 0x10000;

/**
 * PLC 상태를 입력 레지스터 6개로 바꾼다 (설계 문서 4장 PLC 매핑표).
 * 0: 점 16개(비트 0~15), 1~2: seq(uint32), 3~5: 발생 시각(uint48 ms).
 * 값과 seq를 한 요청으로 읽어야 어긋나지 않으므로 코일이 아니라 워드 하나에 담는다.
 */
export class PlcRegisterEncoder {
  encode(plc: PlcSimulator, sampledAt: Date): number[] {
    const ms = sampledAt.getTime();

    return [
      this.toWord(plc.points),
      Math.floor(plc.seq / UINT16) % UINT16,
      plc.seq % UINT16,
      Math.floor(ms / UINT16 / UINT16) % UINT16,
      Math.floor(ms / UINT16) % UINT16,
      ms % UINT16,
    ];
  }

  private toWord(points: boolean[]): number {
    return points.reduce(
      (word, value, pointNo) => (value ? word | (1 << pointNo) : word),
      0,
    );
  }
}
