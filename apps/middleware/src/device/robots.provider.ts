import { Injectable } from "@nestjs/common";
import { RobotEntry } from "../state/robot-state";
import { RobotStateRepository } from "../state/robot-state.repository";

@Injectable()
export class RobotsProvider {
  constructor(private readonly robotStateRepository: RobotStateRepository) {}

  async findAll(): Promise<RobotEntry[]> {
    return await this.robotStateRepository.findAll();
  }

  async findById(deviceId: string): Promise<RobotEntry | undefined> {
    return await this.robotStateRepository.findById(deviceId);
  }
}
