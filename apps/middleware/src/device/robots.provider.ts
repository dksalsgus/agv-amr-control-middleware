import { Injectable } from "@nestjs/common";
import { RobotEntry } from "../state/robot-state";
import { RobotStateRepository } from "../state/robot-state.repository";

@Injectable()
export class RobotsProvider {
  constructor(private readonly robotStateRepository: RobotStateRepository) {}

  findAll(): RobotEntry[] {
    return this.robotStateRepository.findAll();
  }

  findById(deviceId: string): RobotEntry | undefined {
    return this.robotStateRepository.findById(deviceId);
  }
}
