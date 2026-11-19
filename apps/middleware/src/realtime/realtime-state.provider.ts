import { Injectable } from "@nestjs/common";
import { LinkStateEntry, LinkStatus } from "../state/link-state";
import { LinkStateRepository } from "../state/link-state.repository";
import { PlcDeviceLastRead, PlcPointEntry } from "../state/plc-point-state";
import { PlcPointStateRepository } from "../state/plc-point-state.repository";
import { RevisionRepository } from "../state/revision.repository";
import { RobotEntry } from "../state/robot-state";
import { RobotStateRepository } from "../state/robot-state.repository";

@Injectable()
export class RealtimeStateProvider {
  constructor(
    private readonly revisionRepository: RevisionRepository,
    private readonly robotStateRepository: RobotStateRepository,
    private readonly plcPointStateRepository: PlcPointStateRepository,
    private readonly linkStateRepository: LinkStateRepository,
  ) {}

  async findEpoch(): Promise<string> {
    return await this.revisionRepository.findEpoch();
  }

  async findRev(): Promise<number> {
    return await this.revisionRepository.current();
  }

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
}
