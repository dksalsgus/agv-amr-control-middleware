import { Injectable } from "@nestjs/common";
import {
  PlcDeviceLastRead,
  PlcPoint,
  PlcPointEntry,
  PlcPointValue,
} from "../../state/plc-point-state";
import { PlcPointStateRepository } from "../../state/plc-point-state.repository";
import { RevisionRepository } from "../../state/revision.repository";

/** PLC 점 메모리 상태 갱신. 값이 바뀐 점마다 전역 rev를 올린다. */
@Injectable()
export class PlcPointStateProvider {
  constructor(
    private readonly plcPointStateRepository: PlcPointStateRepository,
    private readonly revisionRepository: RevisionRepository,
  ) {}

  async registerPoints(points: PlcPoint[]): Promise<void> {
    for (const point of points) {
      await this.plcPointStateRepository.register(point);
    }
  }

  async findById(pointId: string): Promise<PlcPointEntry | undefined> {
    return await this.plcPointStateRepository.findById(pointId);
  }

  async findLastRead(deviceId: string): Promise<PlcDeviceLastRead | null> {
    return await this.plcPointStateRepository.findLastRead(deviceId);
  }

  async updateLastRead(
    deviceId: string,
    last: PlcDeviceLastRead,
  ): Promise<void> {
    await this.plcPointStateRepository.updateLastRead(deviceId, last);
  }

  async apply(pointId: string, current: PlcPointValue): Promise<void> {
    const rev = await this.revisionRepository.next();
    await this.plcPointStateRepository.updateValue(pointId, current, rev);
  }
}
