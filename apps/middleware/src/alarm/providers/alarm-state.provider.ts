import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { LogsRepository } from "../../history/logs.repository";
import { LogLevel, LogType } from "../../log/log";
import { AppLogger } from "../../logger/app-logger";
import { AlarmEntry } from "../../state/alarm-state";
import { AlarmStateRepository } from "../../state/alarm-state.repository";
import { RemovedEntityRepository } from "../../state/removed-entity.repository";
import { RevisionRepository } from "../../state/revision.repository";
import { AlarmCandidate } from "../alarm.types";

/** 열린 알람을 열고 푼다. 바뀔 때마다 rev를 올리고 logs에 남긴다. */
@Injectable()
export class AlarmStateProvider {
  constructor(
    private readonly alarmStateRepository: AlarmStateRepository,
    private readonly revisionRepository: RevisionRepository,
    private readonly removedEntityRepository: RemovedEntityRepository,
    private readonly logsRepository: LogsRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AlarmStateProvider.name);
  }

  async findOpen(): Promise<AlarmEntry[]> {
    return await this.alarmStateRepository.findAll();
  }

  async isOpen(
    code: AlarmCandidate["code"],
    targetType: AlarmCandidate["targetType"],
    targetId: string,
  ): Promise<boolean> {
    return Boolean(
      await this.alarmStateRepository.findByTarget(code, targetType, targetId),
    );
  }

  async findOpenByCandidate(
    candidate: AlarmCandidate,
  ): Promise<AlarmEntry | undefined> {
    return await this.alarmStateRepository.findByTarget(
      candidate.code,
      candidate.targetType,
      candidate.targetId,
    );
  }

  /** 이미 확인한 알람은 그대로 돌려준다. 그사이 풀렸으면 null */
  async ack(id: string, usersId: string): Promise<AlarmEntry | null> {
    const open = await this.alarmStateRepository.findById(id);
    if (!open) {
      return null;
    }
    if (open.ackedAt) {
      return open;
    }

    const acked: AlarmEntry = {
      id: open.id,
      code: open.code,
      level: open.level,
      targetType: open.targetType,
      targetId: open.targetId,
      message: open.message,
      raisedAt: open.raisedAt,
      ackedAt: new Date(),
      rev: await this.revisionRepository.next(),
    };
    const isReplaced = await this.alarmStateRepository.replace(acked);
    if (!isReplaced) {
      return null;
    }

    await this.writeLog(
      "ALARM_ACKED",
      "INFO",
      acked,
      `${acked.message} 확인`,
      usersId,
    );
    return acked;
  }

  async raise(candidate: AlarmCandidate): Promise<void> {
    const entry: AlarmEntry = {
      id: randomUUID(),
      code: candidate.code,
      level: candidate.level,
      targetType: candidate.targetType,
      targetId: candidate.targetId,
      message: candidate.message,
      raisedAt: new Date(),
      ackedAt: null,
      rev: await this.revisionRepository.next(),
    };
    await this.alarmStateRepository.save(entry);
    await this.writeLog("ALARM_RAISED", entry.level, entry, entry.message);
  }

  async clear(entry: AlarmEntry): Promise<void> {
    await this.alarmStateRepository.remove(entry);
    await this.removedEntityRepository.save({
      kind: "ALARM",
      id: entry.id,
      rev: await this.revisionRepository.next(),
    });
    await this.writeLog(
      "ALARM_CLEARED",
      entry.level,
      entry,
      `${entry.message} 해제`,
    );
  }

  /** 로그 기록 실패는 판정을 멈추지 않도록 서버 로그만 남긴다. */
  private async writeLog(
    type: LogType,
    level: LogLevel,
    entry: AlarmEntry,
    message: string,
    usersId: string | null = null,
  ): Promise<void> {
    this.logger.log(message);

    try {
      await this.logsRepository.insert({
        type,
        level,
        alarm_code: entry.code,
        target_type: entry.targetType,
        target_id: entry.targetId,
        message,
        users_id: usersId,
      });
    } catch (error) {
      this.logger.warn(`알람 로그 기록 실패: ${String(error)}`);
    }
  }
}
