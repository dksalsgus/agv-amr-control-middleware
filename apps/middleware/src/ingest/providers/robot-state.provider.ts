import { Injectable } from "@nestjs/common";
import { RemovedEntityRepository } from "../../state/removed-entity.repository";
import { RevisionRepository } from "../../state/revision.repository";
import { RobotDevice, RobotEntry, RobotState } from "../../state/robot-state";
import { RobotStateRepository } from "../../state/robot-state.repository";

/** 로봇 메모리 상태 갱신. 바뀔 때마다 전역 rev를 올린다. */
@Injectable()
export class RobotStateProvider {
  constructor(
    private readonly robotStateRepository: RobotStateRepository,
    private readonly revisionRepository: RevisionRepository,
    private readonly removedEntityRepository: RemovedEntityRepository,
  ) {}

  async registerDevices(devices: RobotDevice[]): Promise<void> {
    for (const device of devices) {
      const rev = await this.revisionRepository.next();
      await this.robotStateRepository.register(device, rev);
      await this.removedEntityRepository.remove("ROBOT", device.deviceId);
    }
  }

  async unregisterDevices(devices: RobotDevice[]): Promise<void> {
    for (const device of devices) {
      await this.robotStateRepository.remove(device.deviceId);
      await this.removedEntityRepository.save({
        kind: "ROBOT",
        id: device.deviceId,
        rev: await this.revisionRepository.next(),
      });
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
