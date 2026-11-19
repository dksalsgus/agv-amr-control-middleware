import { PLC_POINT_COUNT } from "../config";

/**
 * PLC 인터록 16점. 모두 false(정상)로 시작해 스스로는 바뀌지 않는다.
 * 비정상은 장애를 넣었을 때만 나와야 관제 화면에서 원인을 알 수 있다.
 */
export class PlcSimulator {
  seq = 0;
  readonly points: boolean[] = new Array<boolean>(PLC_POINT_COUNT).fill(false);

  step() {
    this.seq += 1;
  }
}
