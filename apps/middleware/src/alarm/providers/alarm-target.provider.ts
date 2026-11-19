import { Injectable } from "@nestjs/common";
import { LinkStatus } from "../../state/link-state";
import { LinkStateRepository } from "../../state/link-state.repository";
import { PlcDeviceLastRead, PlcPointEntry } from "../../state/plc-point-state";
import { PlcPointStateRepository } from "../../state/plc-point-state.repository";
import { RevisionRepository } from "../../state/revision.repository";
import { RobotEntry } from "../../state/robot-state";
import { RobotStateRepository } from "../../state/robot-state.repository";

/** 알람 판정 대상(로봇, PLC)을 읽고, STALE이 바뀐 대상의 rev를 올린다. */
@Injectable()
export class AlarmTargetProvider {
  constructor(
    private readonly robotStateRepository: RobotStateRepository,
    private readonly plcPointStateRepository: PlcPointStateRepository,
    private readonly linkStateRepository: LinkStateRepository,
    private readonly revisionRepository: RevisionRepository,
  ) {}

  async findRobots(): Promise<RobotEntry[]> {
    return await this.robotStateRepository.findAll();
  }

  async findPlcPoints(): Promise<PlcPointEntry[]> {
    return await this.plcPointStateRepository.findAll();
  }

  async findLinkStatus(connectionId: string): Promise<LinkStatus> {
    const link = await this.linkStateRepository.findById(connectionId);
    return link?.status ?? "UNKNOWN";
  }

  async findLastRead(deviceId: string): Promise<PlcDeviceLastRead | null> {
    return await this.plcPointStateRepository.findLastRead(deviceId);
  }

  /** 장비가 로봇이면 로봇을, PLC면 그 장비의 점을 모두 다시 보내게 한다. */
  async touchDevice(deviceId: string): Promise<void> {
    const rev = await this.revisionRepository.next();
    await this.robotStateRepository.touch(deviceId, rev);

    for (const point of await this.plcPointStateRepository.findAll()) {
      if (point.deviceId === deviceId) {
        await this.plcPointStateRepository.touch(point.pointId, rev);
      }
    }
  }
}
