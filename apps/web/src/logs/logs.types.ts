export type LogType =
  | "LINK_UP"
  | "LINK_DOWN"
  | "ALARM_RAISED"
  | "ALARM_CLEARED"
  | "ALARM_ACKED"
  | "CONFIG_CHANGED";

export type LogTargetType = "CONNECTION" | "DEVICE" | "PLC_POINT";

/** GET /logs의 항목 */
export type LogItem = {
  id: string;
  type: LogType;
  level: string;
  alarmCode: string | null;
  targetType: LogTargetType;
  targetId: string;
  message: string;
  usersId: string | null;
  createdAt: string;
};

export type LogPage = {
  items: LogItem[];
  page: number;
  size: number;
  total: number;
};

/** 값이 "ALL"이면 조건에서 뺀다. */
export type LogFilter = {
  type: LogType | "ALL";
  targetType: LogTargetType | "ALL";
  targetId: string;
};

export type LogQuery = {
  filter: LogFilter;
  page: number;
  size: number;
};

export type LoadStatus = "loading" | "ok" | "empty" | "error";

export type LoadFailure = { request: string; reason: string };

export type TargetOption = { id: string; name: string };

/** 유형 칩 옆 건수. 아직 모르면 없다. */
export type TypeCounts = Partial<Record<LogType | "ALL", number>>;
