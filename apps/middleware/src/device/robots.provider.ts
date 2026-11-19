import { Injectable } from "@nestjs/common";
import { LinkStatus } from "../state/link-state";
import { LinkStateRepository } from "../state/link-state.repository";
import { RobotEntry } from "../state/robot-state";
import { RobotStateRepository } from "../state/robot-state.repository";

@Injectable()
export class RobotsProvider {
  constructor(
    private readonly robotStateRepository: RobotStateRepository,
    private readonly linkStateRepository: LinkStateRepository,
  ) {}

  async findAll(): Promise<RobotEntry[]> {
    return await this.robotStateRepository.findAll();
  }

  async findById(deviceId: string): Promise<RobotEntry | undefined> {
    return await this.robotStateRepository.findById(deviceId);
  }

  async findLinkStatus(connectionId: string): Promise<LinkStatus> {
    const link = await this.linkStateRepository.findById(connectionId);
    return link?.status ?? "UNKNOWN";
  }
}
