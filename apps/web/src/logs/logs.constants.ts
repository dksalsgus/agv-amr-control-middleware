import { IconName } from "../components/icon";
import { LogTargetType, LogType } from "./logs.types";

export const PAGE_SIZE = 100;
export const SKELETON_ROWS = 12;
export const SKELETON_WIDTHS = [96, 80, 64, 88, 120, 220];
export const RECENT_COUNT = 6;

export const LOG_TYPES: LogType[] = [
  "LINK_UP",
  "LINK_DOWN",
  "ALARM_RAISED",
  "ALARM_CLEARED",
  "ALARM_ACKED",
  "CONFIG_CHANGED",
];

export const LOG_LABEL: Record<LogType, string> = {
  LINK_UP: "연결됨",
  LINK_DOWN: "연결 끊김",
  ALARM_RAISED: "알람 발생",
  ALARM_CLEARED: "알람 해제",
  ALARM_ACKED: "알람 확인",
  CONFIG_CHANGED: "설정 변경",
};

export const TARGET_TYPES: LogTargetType[] = [
  "CONNECTION",
  "DEVICE",
  "PLC_POINT",
];

export const TARGET_LABEL: Record<LogTargetType, string> = {
  CONNECTION: "연결",
  DEVICE: "장비",
  PLC_POINT: "PLC 점",
};

export const SEV_ICON: Record<string, IconName> = {
  INFO: "info",
  WARN: "warn",
  CRITICAL: "critical",
};
