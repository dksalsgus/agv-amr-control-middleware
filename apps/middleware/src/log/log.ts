export const LOG_TYPES = ["LINK_UP", "LINK_DOWN"] as const;
export type LogType = (typeof LOG_TYPES)[number];

export const LOG_LEVELS = ["INFO", "WARN", "CRITICAL"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export const LOG_TARGET_TYPES = ["CONNECTION"] as const;
export type LogTargetType = (typeof LOG_TARGET_TYPES)[number];
