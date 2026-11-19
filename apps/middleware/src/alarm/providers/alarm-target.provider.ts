import { Injectable } from "@nestjs/common";
import { LinkStateEntry, LinkStatus } from "../../state/link-state";
import { LinkStateRepository } from "../../state/link-state.repository";
import { PlcDeviceLastRead, PlcPointEntry } from "../../state/plc-point-state";
import { PlcPointStateRepository } from "../../state/plc-point-state.repository";
import { RevisionRepository } from "../../state/revision.repository";
import { RobotEntry } from "../../state/robot-state";
import { RobotStateRepository } from "../../state/robot-state.repository";

/** 알람 판정 대상(로봇, PLC)을 읽고, STALE이 바뀐 대상의 rev를 올린다. */
@Injectable()
export class AlarmTargetProvider {
  /** 지난 판정에서 STALE이던 장비. 바뀐 장비만 rev를 올리려고 둔다. */
  private readonly staleDeviceIds = new Set<string>();

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

  async findLinks(): Promise<LinkStateEntry[]> {
    return await this.linkStateRepository.findAll();
  }

  async findLinkStatus(connectionId: string): Promise<LinkStatus> {
    const link = await this.linkStateRepository.findById(connectionId);
    return link?.status ?? "UNKNOWN";
  }

  async findLastRead(deviceId: string): Promise<PlcDeviceLastRead | null> {
    return await this.plcPointStateRepository.findLastRead(deviceId);
  }

  /** STALE 여부가 지난 판정과 다를 때만 rev를 올려 화면의 STALE 표시를 바꾼다. */
  async touchIfStaleChanged(deviceId: string, stale: boolean): Promise<void> {
    const wasStale = this.staleDeviceIds.has(deviceId);
    if (stale === wasStale) {
      return;
    }

    if (stale) {
      this.staleDeviceIds.add(deviceId);
    } else {
      this.staleDeviceIds.delete(deviceId);
    }
    await this.touchDevice(deviceId);
  }

  /** 장비가 로봇이면 로봇을, PLC면 그 장비의 점을 모두 다시 보내게 한다. */
  private async touchDevice(deviceId: string): Promise<void> {
    const rev = await this.revisionRepository.next();
    await this.robotStateRepository.touch(deviceId, rev);

    for (const point of await this.plcPointStateRepository.findAll()) {
      if (point.deviceId === deviceId) {
        await this.plcPointStateRepository.touch(point.pointId, rev);
      }
    }
  }
}
