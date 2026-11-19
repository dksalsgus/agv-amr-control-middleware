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

  /** 같은 알람이 아직 열려 있을 때만 바꾼다. 바꿨으면 true */
  async replace(entry: AlarmEntry): Promise<boolean> {
    const key = this.toKey(entry.code, entry.targetType, entry.targetId);
    if (this.entries.get(key)?.id !== entry.id) {
      return false;
    }

    this.entries.set(key, entry);
    return true;
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
