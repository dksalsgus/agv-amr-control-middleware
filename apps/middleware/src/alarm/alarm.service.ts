import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { isRobotStale, isPlcStale } from "../common/utils/stale-judge.util";
import { linkQualityConfig } from "../config/link-quality.config";
import { staleConfig } from "../config/stale.config";
import { AlarmEntry } from "../state/alarm-state";
import { LinkState } from "../state/link-state";
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
    @Inject(staleConfig.KEY)
    private readonly staleSettings: ConfigType<typeof staleConfig>,
    @Inject(linkQualityConfig.KEY)
    private readonly qualitySettings: ConfigType<typeof linkQualityConfig>,
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
      const link = await this.alarmTargetProvider.findLink(robot.connectionId);
      const linkStatus = link?.status ?? "UNKNOWN";
      const stale = isRobotStale(
        robot.state,
        linkStatus,
        now,
        this.staleSettings,
      );
      const canAlarmStale = this.canAlarmStale(
        link,
        now,
        this.staleSettings.robotSilenceMs,
      );
      for (const candidate of await this.alarmJudgeProvider.judgeRobot(
        robot,
        stale,
        canAlarmStale,
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
      const link = await this.alarmTargetProvider.findLink(
        points[0].connectionId,
      );
      const stale = isPlcStale(
        await this.alarmTargetProvider.findLastRead(deviceId),
        link?.status ?? "UNKNOWN",
        now,
        this.staleSettings,
      );
      const canAlarmStale = this.canAlarmStale(
        link,
        now,
        this.staleSettings.plcSilenceMs,
      );
      candidates.push(
        await this.alarmJudgeProvider.judgePlcDevice(
          deviceId,
          stale,
          canAlarmStale,
        ),
      );
    }

    for (const link of await this.alarmTargetProvider.findLinks()) {
      const isOpen = await this.alarmStateProvider.isOpen(
        "LINK_LOSS",
        "CONNECTION",
        link.connectionId,
      );
      candidates.push(
        await this.alarmJudgeProvider.judgeLinkLoss(
          link.connectionId,
          await this.findLossPct(link.connectionId, link.state, now),
          isOpen,
        ),
      );
    }

    return candidates;
  }

  /**
   * 연결이 UP인 동안의 최근 유실률(%). UP이 된 뒤의 표본만 써서 끊겼던 동안의 실패가 섞이지 않게 한다.
   * UP이 아니거나 표본이 모자라면 null. 끊김은 DEVICE_STALE이 알리므로 유실률로 따로 알리지 않는다.
   */
  private async findLossPct(
    connectionId: string,
    link: LinkState,
    now: Date,
  ): Promise<number | null> {
    const upSince = link.status === "UP" ? link.changedAt : null;
    if (!upSince) {
      return null;
    }

    const windowStart = now.getTime() - this.qualitySettings.windowMs;
    const since = new Date(Math.max(upSince.getTime(), windowStart));
    const samples = await this.alarmTargetProvider.findQualitySamples(
      connectionId,
      since,
    );
    const expected = samples.reduce((sum, sample) => sum + sample.expected, 0);
    const lost = samples.reduce((sum, sample) => sum + sample.lost, 0);
    if (expected < this.qualitySettings.minExpected) {
      return null;
    }

    return (lost / expected) * 100;
  }

  /**
   * STALE 알람을 열어도 되는 연결인지. 연결이 끊기면 바로 열고,
   * 판정 전(UNKNOWN)이거나 막 UP이 된 뒤 첫 데이터를 기다리는 동안(graceMs)은 열지 않는다.
   * MQTT는 브로커에 붙자마자 UP이라, 기동 직후 장비가 아직 보내기 전에 알람이 열렸다 닫히던 것을 막는다.
   */
  private canAlarmStale(
    link: LinkState | null,
    now: Date,
    graceMs: number,
  ): boolean {
    if (link?.status === "DOWN") {
      return true;
    }

    const upSince = link?.status === "UP" ? link.changedAt : null;
    if (!upSince) {
      return false;
    }

    return now.getTime() - upSince.getTime() >= graceMs;
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
