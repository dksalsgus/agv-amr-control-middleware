import { AlarmCode, LogLevel, LogTargetType } from "../log/log";

/** 판정 결과 하나. active면 열고, 아니면 열려 있던 것을 푼다. */
export type AlarmCandidate = {
  code: AlarmCode;
  level: LogLevel;
  targetType: LogTargetType;
  targetId: string;
  message: string;
  active: boolean;
};
