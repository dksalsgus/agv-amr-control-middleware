import { Injectable, NotFoundException } from "@nestjs/common";
import { RobotEntry, RobotState } from "../state/robot-state";
import {
  GetRobotResponseDto,
  GetRobotStateDto,
} from "./dto/get-robot.response.dto";
import {
  GetRobotsItemDto,
  GetRobotsResponseDto,
  GetRobotsStateDto,
} from "./dto/get-robots.response.dto";
import { RobotsProvider } from "./robots.provider";

@Injectable()
export class RobotsService {
  constructor(private readonly robotsProvider: RobotsProvider) {}

  async getRobots(): Promise<GetRobotsResponseDto> {
    const entries = await this.robotsProvider.findAll();

    const robots: GetRobotsItemDto[] = [];
    for (const entry of entries) {
      robots.push(await this.toItem(entry));
    }

    return { robots };
  }

  async getRobot(id: string): Promise<GetRobotResponseDto> {
    const entry = await this.robotsProvider.findById(id);
    if (!entry) {
      throw new NotFoundException(`로봇이 없습니다: ${id}`);
    }

    return {
      id: entry.deviceId,
      connectionId: entry.connectionId,
      externalId: entry.externalId,
      name: entry.name,
      type: entry.type,
      rev: entry.rev,
      state: entry.state ? await this.toState(entry.state) : null,
    };
  }

  private async toItem(entry: RobotEntry): Promise<GetRobotsItemDto> {
    return {
      id: entry.deviceId,
      connectionId: entry.connectionId,
      externalId: entry.externalId,
      name: entry.name,
      type: entry.type,
      rev: entry.rev,
      state: entry.state ? await this.toState(entry.state) : null,
    };
  }

  private async toState(
    state: RobotState,
  ): Promise<GetRobotsStateDto & GetRobotStateDto> {
    return {
      seq: state.seq,
      sourceTs: state.sourceTs.toISOString(),
      receivedTs: state.receivedTs.toISOString(),
      x: state.x,
      y: state.y,
      theta: state.theta,
      speed: state.speed,
      batteryPct: state.batteryPct,
      opState: state.opState,
      errorCode: state.errorCode,
      loaded: state.loaded,
    };
  }
}
