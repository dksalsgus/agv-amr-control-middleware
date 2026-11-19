export const LOG_TYPES = [
  "LINK_UP",
  "LINK_DOWN",
  "ALARM_RAISED",
  "ALARM_CLEARED",
  "ALARM_ACKED",
] as const;
export type LogType = (typeof LOG_TYPES)[number];

export const LOG_LEVELS = ["INFO", "WARN", "CRITICAL"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export const LOG_TARGET_TYPES = ["CONNECTION", "DEVICE", "PLC_POINT"] as const;
export type LogTargetType = (typeof LOG_TARGET_TYPES)[number];

export const ALARM_CODES = [
  "ROBOT_ERROR",
  "DEVICE_STALE",
  "PLC_ABNORMAL",
  "LOW_BATTERY",
] as const;
export type AlarmCode = (typeof ALARM_CODES)[number];
