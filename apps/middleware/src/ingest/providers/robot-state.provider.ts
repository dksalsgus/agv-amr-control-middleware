import { Injectable } from "@nestjs/common";
import { RevisionRepository } from "../../state/revision.repository";
import { RobotDevice, RobotEntry, RobotState } from "../../state/robot-state";
import { RobotStateRepository } from "../../state/robot-state.repository";

/** 로봇 메모리 상태 갱신. 바뀔 때마다 전역 rev를 올린다. */
@Injectable()
export class RobotStateProvider {
  constructor(
    private readonly robotStateRepository: RobotStateRepository,
    private readonly revisionRepository: RevisionRepository,
  ) {}

  async registerDevices(devices: RobotDevice[]): Promise<void> {
    for (const device of devices) {
      await this.robotStateRepository.register(device);
    }
  }

  async findByExternalId(
    connectionId: string,
    externalId: string,
  ): Promise<RobotEntry | undefined> {
    return await this.robotStateRepository.findByExternalId(
      connectionId,
      externalId,
    );
  }

  async apply(deviceId: string, state: RobotState): Promise<void> {
    const rev = await this.revisionRepository.next();
    await this.robotStateRepository.updateState(deviceId, state, rev);
  }
}
