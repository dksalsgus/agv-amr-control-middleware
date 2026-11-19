import { Injectable, NotFoundException } from "@nestjs/common";
import { StaleJudgeProvider } from "../device/stale-judge.provider";
import { AlarmEntry } from "../state/alarm-state";
import { PlcPointEntry } from "../state/plc-point-state";
import { AlarmCandidate } from "./alarm.types";
import { GetAlarmsItemDto } from "./dto/get-alarms.item.dto";
import { GetAlarmsResponseDto } from "./dto/get-alarms.response.dto";
import { PostAlarmAckResponseDto } from "./dto/post-alarm-ack.response.dto";
import { AlarmJudgeProvider } from "./providers/alarm-judge.provider";
import { AlarmStateProvider } from "./providers/alarm-state.provider";
import { AlarmTargetProvider } from "./providers/alarm-target.provider";

@Injectable()
export class AlarmService {
  constructor(
    private readonly alarmTargetProvider: AlarmTargetProvider,
    private readonly alarmJudgeProvider: AlarmJudgeProvider,
    private readonly alarmStateProvider: AlarmStateProvider,
    private readonly staleJudgeProvider: StaleJudgeProvider,
  ) {}

  /** 모든 대상을 판정해 알람을 열고 푼다. 대상이 사라진 알람도 푼다. */
  async evaluate(): Promise<void> {
    const candidates = await this.collectCandidates(new Date());
    const judgedKeys = new Set<string>();

    for (const candidate of candidates) {
      judgedKeys.add(this.toKey(candidate));
      await this.apply(candidate);
    }

    for (const entry of await this.alarmStateProvider.findOpen()) {
      if (!judgedKeys.has(this.toKey(entry))) {
        await this.alarmStateProvider.clear(entry);
      }
    }
  }

  /** 최근에 열린 알람부터 */
  async getAlarms(): Promise<GetAlarmsResponseDto> {
    const entries = await this.alarmStateProvider.findOpen();
    const alarms: GetAlarmsItemDto[] = entries
      .sort((a, b) => b.raisedAt.getTime() - a.raisedAt.getTime())
      .map((entry) => this.toItem(entry));

    return { alarms };
  }

  /** 이미 풀린 알람이면 404 */
  async ackAlarm(
    id: string,
    rolesUsersId: string,
  ): Promise<PostAlarmAckResponseDto> {
    const acked = await this.alarmStateProvider.ack(id, rolesUsersId);
    if (!acked || !acked.ackedAt) {
      throw new NotFoundException(`열린 알람이 없습니다: ${id}`);
    }

    return {
      id: acked.id,
      ackedAt: acked.ackedAt.toISOString(),
      rev: acked.rev,
    };
  }

  private async collectCandidates(now: Date): Promise<AlarmCandidate[]> {
    const candidates: AlarmCandidate[] = [];

    for (const robot of await this.alarmTargetProvider.findRobots()) {
      const linkStatus = await this.alarmTargetProvider.findLinkStatus(
        robot.connectionId,
      );
      const stale = await this.staleJudgeProvider.isRobotStale(
        robot.state,
        linkStatus,
        now,
      );
      for (const candidate of await this.alarmJudgeProvider.judgeRobot(
        robot,
        stale,
        linkStatus,
      )) {
        candidates.push(candidate);
      }
    }

    const pointsByDevice = new Map<string, PlcPointEntry[]>();
    for (const point of await this.alarmTargetProvider.findPlcPoints()) {
      const candidate = await this.alarmJudgeProvider.judgePlcPoint(point);
      if (candidate) {
        candidates.push(candidate);
      }

      const devicePoints = pointsByDevice.get(point.deviceId) ?? [];
      devicePoints.push(point);
      pointsByDevice.set(point.deviceId, devicePoints);
    }

    for (const [deviceId, points] of pointsByDevice) {
      const linkStatus = await this.alarmTargetProvider.findLinkStatus(
        points[0].connectionId,
      );
      const stale = await this.staleJudgeProvider.isPlcStale(
        await this.alarmTargetProvider.findLastRead(deviceId),
        linkStatus,
        now,
      );
      candidates.push(
        await this.alarmJudgeProvider.judgePlcDevice(
          deviceId,
          stale,
          linkStatus,
        ),
      );
    }

    return candidates;
  }

  /** DEVICE_STALE이 열리고 풀릴 때는 장비 rev도 올려 화면의 stale 표시를 바꾼다. */
  private async apply(candidate: AlarmCandidate): Promise<void> {
    const open = await this.alarmStateProvider.findOpenByCandidate(candidate);
    if (candidate.active === Boolean(open)) {
      return;
    }

    if (open) {
      await this.alarmStateProvider.clear(open);
    } else {
      await this.alarmStateProvider.raise(candidate);
    }

    if (candidate.code === "DEVICE_STALE") {
      await this.alarmTargetProvider.touchDevice(candidate.targetId);
    }
  }

  private toItem(entry: AlarmEntry): GetAlarmsItemDto {
    return {
      id: entry.id,
      code: entry.code,
      level: entry.level,
      targetType: entry.targetType,
      targetId: entry.targetId,
      message: entry.message,
      raisedAt: entry.raisedAt.toISOString(),
      ackedAt: entry.ackedAt?.toISOString() ?? null,
      rev: entry.rev,
    };
  }

  private toKey(alarm: {
    code: string;
    targetType: string;
    targetId: string;
  }): string {
    return `${alarm.code}:${alarm.targetType}:${alarm.targetId}`;
  }
}
