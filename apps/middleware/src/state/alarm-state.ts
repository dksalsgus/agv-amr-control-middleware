import { AlarmCode, LogLevel, LogTargetType } from "../log/log";

/** 지금 열려 있는 알람(메모리). 풀리면 지운다. */
export type AlarmEntry = {
  id: string;
  code: AlarmCode;
  level: LogLevel;
  targetType: LogTargetType;
  targetId: string;
  message: string;
  raisedAt: Date;
  ackedAt: Date | null;
  rev: number;
};
