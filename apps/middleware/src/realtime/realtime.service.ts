import { Injectable } from "@nestjs/common";
import { StaleJudgeProvider } from "../device/stale-judge.provider";
import { LinkStateEntry } from "../state/link-state";
import { PlcPointEntry } from "../state/plc-point-state";
import { RobotEntry, RobotState } from "../state/robot-state";
import { RealtimeLinkDto } from "./dto/realtime-link.dto";
import { RealtimePlcPointDto } from "./dto/realtime-plc-point.dto";
import { RealtimeRobotStateDto } from "./dto/realtime-robot-state.dto";
import { RealtimeRobotDto } from "./dto/realtime-robot.dto";
import { SnapshotMessageDto } from "./dto/snapshot.message.dto";
import { RealtimeStateProvider } from "./realtime-state.provider";

@Injectable()
export class RealtimeService {
  constructor(
    private readonly realtimeStateProvider: RealtimeStateProvider,
    private readonly staleJudgeProvider: StaleJudgeProvider,
  ) {}

  /** rev를 먼저 읽는다. 읽는 사이 바뀐 엔티티는 다음 delta에 다시 실려도 된다. */
  async getSnapshot(): Promise<SnapshotMessageDto> {
    const rev = await this.realtimeStateProvider.findRev();
    const now = new Date();

    const robots: RealtimeRobotDto[] = [];
    for (const entry of await this.realtimeStateProvider.findRobots()) {
      robots.push(await this.toRobot(entry, now));
    }

    const plcPoints: RealtimePlcPointDto[] = [];
    for (const entry of await this.realtimeStateProvider.findPlcPoints()) {
      plcPoints.push(await this.toPlcPoint(entry, now));
    }

    const links = await this.realtimeStateProvider.findLinks();

    return {
      epoch: await this.realtimeStateProvider.findEpoch(),
      rev,
      robots,
      plcPoints,
      links: links.map((link) => this.toLink(link)),
      alarms: [],
    };
  }

  private async toRobot(
    entry: RobotEntry,
    now: Date,
  ): Promise<RealtimeRobotDto> {
    const linkStatus = await this.realtimeStateProvider.findLinkStatus(
      entry.connectionId,
    );

    return {
      id: entry.deviceId,
      connectionId: entry.connectionId,
      externalId: entry.externalId,
      name: entry.name,
      type: entry.type,
      rev: entry.rev,
      stale: await this.staleJudgeProvider.isRobotStale(
        entry.state,
        linkStatus,
        now,
      ),
      state: entry.state ? this.toRobotState(entry.state) : null,
    };
  }

  private toRobotState(state: RobotState): RealtimeRobotStateDto {
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

  private async toPlcPoint(
    entry: PlcPointEntry,
    now: Date,
  ): Promise<RealtimePlcPointDto> {
    const value = entry.current?.value ?? null;
    const lastRead = await this.realtimeStateProvider.findLastRead(
      entry.deviceId,
    );
    const linkStatus = await this.realtimeStateProvider.findLinkStatus(
      entry.connectionId,
    );

    return {
      id: entry.pointId,
      deviceId: entry.deviceId,
      pointNo: entry.pointNo,
      name: entry.name,
      type: entry.type,
      normalValue: entry.normalValue,
      alarmOnAbnormal: entry.alarmOnAbnormal,
      value,
      abnormal: value !== null && value !== entry.normalValue,
      changedAt: entry.current?.sourceTs.toISOString() ?? null,
      stale: await this.staleJudgeProvider.isPlcStale(
        lastRead,
        linkStatus,
        now,
      ),
      rev: entry.rev,
    };
  }

  private toLink(entry: LinkStateEntry): RealtimeLinkDto {
    return {
      connectionId: entry.connectionId,
      status: entry.state.status,
      changedAt: entry.state.changedAt?.toISOString() ?? null,
      rev: entry.state.rev,
    };
  }
}
