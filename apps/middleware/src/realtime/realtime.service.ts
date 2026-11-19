import { Injectable } from "@nestjs/common";
import { StaleJudgeProvider } from "../device/stale-judge.provider";
import { LinkStateEntry } from "../state/link-state";
import { PlcPointEntry } from "../state/plc-point-state";
import { RobotEntry, RobotState } from "../state/robot-state";
import { RealtimeLinkDto } from "./dto/realtime-link.dto";
import { RealtimePlcPointDto } from "./dto/realtime-plc-point.dto";
import { RealtimeRobotStateDto } from "./dto/realtime-robot-state.dto";
import { RealtimeRobotDto } from "./dto/realtime-robot.dto";
import { DeltaMessageDto } from "./dto/delta.message.dto";
import { HelloMessageDto } from "./dto/hello.message.dto";
import { SnapshotMessageDto } from "./dto/snapshot.message.dto";
import { ChangedEntities, RealtimeReply } from "./realtime.types";
import { RealtimeStateProvider } from "./realtime-state.provider";

@Injectable()
export class RealtimeService {
  /** 모든 엔티티의 rev는 0 이상이다. */
  private static readonly ALL = -1;

  constructor(
    private readonly realtimeStateProvider: RealtimeStateProvider,
    private readonly staleJudgeProvider: StaleJudgeProvider,
  ) {}

  /** 같은 epoch에서 이어받을 수 있으면 delta, 아니면 snapshot */
  async hello(message: HelloMessageDto): Promise<RealtimeReply> {
    const epoch = await this.realtimeStateProvider.findEpoch();
    if (message.epoch !== epoch || message.lastRev === undefined) {
      return { event: "snapshot", data: await this.getSnapshot() };
    }

    return await this.resync(message.lastRev);
  }

  /** 서버 rev보다 앞선 lastRev는 이어받을 수 없어 snapshot으로 답한다. */
  async resync(lastRev: number): Promise<RealtimeReply> {
    const rev = await this.realtimeStateProvider.findRev();
    if (lastRev > rev) {
      return { event: "snapshot", data: await this.getSnapshot() };
    }

    return { event: "delta", data: await this.getDeltaSince(lastRev) };
  }

  /** 바뀐 것이 없으면 null */
  async getDelta(fromRev: number): Promise<DeltaMessageDto | null> {
    const rev = await this.realtimeStateProvider.findRev();
    if (rev === fromRev) {
      return null;
    }

    return await this.getDeltaSince(fromRev);
  }

  /** rev를 먼저 읽는다. 읽는 사이 바뀐 엔티티는 다음 delta에 다시 실려도 된다. */
  async getSnapshot(): Promise<SnapshotMessageDto> {
    const rev = await this.realtimeStateProvider.findRev();
    const changed = await this.collectChanged(RealtimeService.ALL);

    return {
      epoch: await this.realtimeStateProvider.findEpoch(),
      rev,
      robots: changed.robots,
      plcPoints: changed.plcPoints,
      links: changed.links,
      alarms: [],
    };
  }

  private async getDeltaSince(fromRev: number): Promise<DeltaMessageDto> {
    const rev = await this.realtimeStateProvider.findRev();
    const changed = await this.collectChanged(fromRev);
    const removed = await this.realtimeStateProvider.findRemovedAfter(fromRev);

    return {
      fromRev,
      rev,
      robots: changed.robots,
      plcPoints: changed.plcPoints,
      links: changed.links,
      removed: removed.map((entity) => ({ kind: entity.kind, id: entity.id })),
    };
  }

  /** rev가 fromRev보다 큰 엔티티만 모은다. */
  private async collectChanged(fromRev: number): Promise<ChangedEntities> {
    const now = new Date();

    const robots: RealtimeRobotDto[] = [];
    for (const entry of await this.realtimeStateProvider.findRobots()) {
      if (entry.rev > fromRev) {
        robots.push(await this.toRobot(entry, now));
      }
    }

    const plcPoints: RealtimePlcPointDto[] = [];
    for (const entry of await this.realtimeStateProvider.findPlcPoints()) {
      if (entry.rev > fromRev) {
        plcPoints.push(await this.toPlcPoint(entry, now));
      }
    }

    const links = await this.realtimeStateProvider.findLinks();

    return {
      robots,
      plcPoints,
      links: links
        .filter((link) => link.state.rev > fromRev)
        .map((link) => this.toLink(link)),
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
