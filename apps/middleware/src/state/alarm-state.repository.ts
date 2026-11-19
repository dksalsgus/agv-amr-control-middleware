import { Injectable } from "@nestjs/common";
import { AlarmCode, LogTargetType } from "../log/log";
import { AlarmEntry } from "./alarm-state";

/** 열린 알람(메모리). 같은 대상의 같은 코드는 하나만 연다. */
@Injectable()
export class AlarmStateRepository {
  private readonly entries = new Map<string, AlarmEntry>();

  async findAll(): Promise<AlarmEntry[]> {
    return Array.from(this.entries.values());
  }

  async findById(id: string): Promise<AlarmEntry | undefined> {
    return Array.from(this.entries.values()).find((entry) => entry.id === id);
  }

  async findByTarget(
    code: AlarmCode,
    targetType: LogTargetType,
    targetId: string,
  ): Promise<AlarmEntry | undefined> {
    return this.entries.get(this.toKey(code, targetType, targetId));
  }

  async save(entry: AlarmEntry): Promise<void> {
    this.entries.set(
      this.toKey(entry.code, entry.targetType, entry.targetId),
      entry,
    );
  }

  async remove(entry: AlarmEntry): Promise<void> {
    this.entries.delete(
      this.toKey(entry.code, entry.targetType, entry.targetId),
    );
  }

  private toKey(
    code: AlarmCode,
    targetType: LogTargetType,
    targetId: string,
  ): string {
    return `${code}:${targetType}:${targetId}`;
  }
}
