import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { isRobotStale } from "../common/utils/stale-judge.util";
import { staleConfig } from "../config/stale.config";
import { RobotEntry, RobotState } from "../state/robot-state";
import { GetRobotResponseDto } from "./dto/get-robot.response.dto";
import { GetRobotStateDto } from "./dto/get-robot.state.dto";
import { GetRobotsResponseDto } from "./dto/get-robots.response.dto";
import { GetRobotsItemDto } from "./dto/get-robots.item.dto";
import { GetRobotsStateDto } from "./dto/get-robots.state.dto";
import { RobotsProvider } from "./robots.provider";

@Injectable()
export class RobotsService {
  constructor(
    private readonly robotsProvider: RobotsProvider,
    @Inject(staleConfig.KEY)
    private readonly staleSettings: ConfigType<typeof staleConfig>,
  ) {}

  async getRobots(): Promise<GetRobotsResponseDto> {
    const entries = await this.robotsProvider.findAll();
    const now = new Date();

    const robots: GetRobotsItemDto[] = [];
    for (const entry of entries) {
      robots.push(await this.toItem(entry, now));
    }

    return { robots };
  }

  async getRobot(id: string): Promise<GetRobotResponseDto> {
    const entry = await this.robotsProvider.findById(id);
    if (!entry) {
      throw new NotFoundException(`로봇이 없습니다: ${id}`);
    }

    return await this.toItem(entry, new Date());
  }

  private async toItem(
    entry: RobotEntry,
    now: Date,
  ): Promise<GetRobotsItemDto & GetRobotResponseDto> {
    const linkStatus = await this.robotsProvider.findLinkStatus(
      entry.connectionId,
    );

    return {
      id: entry.deviceId,
      connectionId: entry.connectionId,
      externalId: entry.externalId,
      name: entry.name,
      type: entry.type,
      rev: entry.rev,
      stale: isRobotStale(entry.state, linkStatus, now, this.staleSettings),
      state: entry.state ? this.toState(entry.state) : null,
    };
  }

  private toState(state: RobotState): GetRobotsStateDto & GetRobotStateDto {
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
