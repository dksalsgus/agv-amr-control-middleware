import { Injectable } from "@nestjs/common";
import {
  PlcPoint,
  PlcPointEntry,
  PlcPointValue,
} from "../../state/plc-point-state";
import { PlcPointStateRepository } from "../../state/plc-point-state.repository";
import { RevisionRepository } from "../../state/revision.repository";
import { SeqPoint } from "./seq-judge.provider";

/**
 * PLC 점의 메모리 상태 갱신. 값이 바뀐 점마다 전역 rev를 하나 올려 붙인다.
 */
@Injectable()
export class PlcPointStateProvider {
  constructor(
    private readonly plcPointStateRepository: PlcPointStateRepository,
    private readonly revisionRepository: RevisionRepository,
  ) {}

  registerPoints(points: PlcPoint[]) {
    for (const point of points) {
      this.plcPointStateRepository.register(point);
    }
  }

  findById(pointId: string): PlcPointEntry | undefined {
    return this.plcPointStateRepository.findById(pointId);
  }

  findLastSeq(deviceId: string): SeqPoint | null {
    return this.plcPointStateRepository.findLastSeq(deviceId);
  }

  updateLastSeq(deviceId: string, last: SeqPoint) {
    this.plcPointStateRepository.updateLastSeq(deviceId, last);
  }

  apply(pointId: string, current: PlcPointValue) {
    const rev = this.revisionRepository.next();
    this.plcPointStateRepository.updateValue(pointId, current, rev);
  }
}
