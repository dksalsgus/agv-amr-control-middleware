import { PLC_POINT_COUNT } from "../config";

/** PLC 인터록 16점. false(정상)로 시작해 가끔 뒤집힌다. */
export class PlcSimulator {
  /** 교차로 점유·일반 신호가 한 주기에 뒤집힐 확률. 500ms 주기에서 평균 25초에 한 번 바뀐다. */
  private static readonly FLIP_PROBABILITY = 0.02;
  /**
   * 도어(0~3)와 비상정지(8, 9)는 알람이 걸리는 신호라 드물게 바꾼다. 평균 약 17분에 한 번이다.
   * 다른 신호처럼 자주 바꾸면 알람이 몇 초마다 생겼다 풀려 관제 화면이 알람으로 넘친다.
   */
  private static readonly RARE_POINTS = new Set([0, 1, 2, 3, 8, 9]);
  private static readonly RARE_FLIP_PROBABILITY = 0.0005;

  seq = 0;
  readonly points: boolean[] = new Array<boolean>(PLC_POINT_COUNT).fill(false);

  constructor(private readonly random: () => number = Math.random) {}

  step() {
    for (const pointNo of this.points.keys()) {
      const probability = PlcSimulator.RARE_POINTS.has(pointNo)
        ? PlcSimulator.RARE_FLIP_PROBABILITY
        : PlcSimulator.FLIP_PROBABILITY;
      if (this.random() < probability) {
        this.points[pointNo] = !this.points[pointNo];
      }
    }

    this.seq += 1;
  }
}
