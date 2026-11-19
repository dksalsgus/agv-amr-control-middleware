/** 미들웨어 WebSocket 메시지. 규격의 기준은 설계 문서 6장이다. */
export type RobotState = {
  seq: number;
  sourceTs: string;
  receivedTs: string;
  x: number;
  y: number;
  theta: number;
  speed: number;
  batteryPct: number;
  opState: string;
  errorCode: string | null;
  loaded: boolean;
};

export type Robot = {
  id: string;
  connectionId: string;
  externalId: string;
  name: string;
  type: string;
  rev: number;
  stale: boolean;
  state: RobotState | null;
};

export type PlcPoint = {
  id: string;
  deviceId: string;
  pointNo: number;
  name: string;
  type: string;
  normalValue: boolean;
  alarmOnAbnormal: boolean;
  value: boolean | null;
  abnormal: boolean;
  changedAt: string | null;
  stale: boolean;
  rev: number;
};

export type Link = {
  connectionId: string;
  status: string;
  changedAt: string | null;
  rev: number;
};

export type Alarm = {
  id: string;
  code: string;
  level: string;
  targetType: string;
  targetId: string;
  message: string;
  raisedAt: string;
  ackedAt: string | null;
  rev: number;
};

export type RemovedEntity = {
  kind: "ROBOT" | "PLC_POINT" | "LINK" | "ALARM";
  id: string;
};

export type SnapshotMessage = {
  epoch: string;
  rev: number;
  robots: Robot[];
  plcPoints: PlcPoint[];
  links: Link[];
  alarms: Alarm[];
};

export type DeltaMessage = {
  fromRev: number;
  rev: number;
  robots: Robot[];
  plcPoints: PlcPoint[];
  links: Link[];
  alarms: Alarm[];
  removed: RemovedEntity[];
};

export type ServerMessage =
  | { event: "snapshot"; data: SnapshotMessage }
  | { event: "delta"; data: DeltaMessage }
  | { event: "ping"; data: { t: number } }
  | { event: "pong"; data: { t: number } }
  | { event: "error"; data: { message: string | string[] } };

/** delta를 반영한 결과. GAP이면 중간을 놓친 것이라 resync가 필요하다. */
export type DeltaResult = "APPLIED" | "ALREADY_SEEN" | "GAP";

/** 화면에 보이는 서버 연결 상태 */
export type SocketStatus = "CONNECTING" | "OPEN" | "DISCONNECTED";

/** React가 그리는 값. 바뀔 때마다 새 객체라 참조 비교로 다시 그린다. */
export type RealtimeView = {
  status: SocketStatus;
  epoch: string | null;
  rev: number;
  robots: ReadonlyMap<string, Robot>;
  plcPoints: ReadonlyMap<string, PlcPoint>;
  links: ReadonlyMap<string, Link>;
  alarms: ReadonlyMap<string, Alarm>;
  /** 마지막 재접속에서 소켓 종료부터 상태 반영까지 걸린 시간(ms) */
  lastRecoveryMs: number | null;
};
