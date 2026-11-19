import { PLC_POINT_COUNT } from "../config";

/** 한 주기에 점 하나가 뒤집힐 확률. 500ms 주기에서 점마다 평균 25초에 한 번 바뀐다. */
const FLIP_PROBABILITY = 0.02;

/**
 * PLC 인터록 16점을 모사한다. 모든 점은 false(정상)로 시작하고 가끔 뒤집힌다.
 */
export class PlcSimulator {
  seq = 0;
  readonly points: boolean[] = new Array<boolean>(PLC_POINT_COUNT).fill(false);

  constructor(private readonly random: () => number = Math.random) {}

  step() {
    for (const pointNo of this.points.keys()) {
      if (this.random() < FLIP_PROBABILITY) {
        this.points[pointNo] = !this.points[pointNo];
      }
    }

    this.seq += 1;
  }
}
