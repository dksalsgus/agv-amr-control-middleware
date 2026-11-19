import { Injectable } from "@nestjs/common";
import { RevisionRepository } from "../../state/revision.repository";
import { RobotDevice, RobotEntry, RobotState } from "../../state/robot-state";
import { RobotStateRepository } from "../../state/robot-state.repository";

/**
 * 메모리 상태 갱신. 상태가 바뀔 때마다 전역 rev를 하나 올려 붙인다.
 */
@Injectable()
export class RobotStateProvider {
  constructor(
    private readonly robotStateRepository: RobotStateRepository,
    private readonly revisionRepository: RevisionRepository,
  ) {}

  registerDevices(devices: RobotDevice[]) {
    for (const device of devices) {
      this.robotStateRepository.register(device);
    }
  }

  findByExternalId(
    connectionId: string,
    externalId: string,
  ): RobotEntry | undefined {
    return this.robotStateRepository.findByExternalId(connectionId, externalId);
  }

  apply(deviceId: string, state: RobotState) {
    const rev = this.revisionRepository.next();
    this.robotStateRepository.updateState(deviceId, state, rev);
  }
}
