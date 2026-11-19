export const ROBOT_OP_STATES = [
  "IDLE",
  "MOVING",
  "CHARGING",
  "PAUSED",
  "ERROR",
] as const;

export type RobotOpState = (typeof ROBOT_OP_STATES)[number];

/** 공통 로봇 상태. 단위는 m, 도, m/s, %. */
export type RobotState = {
  seq: number;
  sourceTs: Date;
  receivedTs: Date;
  x: number;
  y: number;
  theta: number;
  speed: number;
  batteryPct: number;
  opState: RobotOpState;
  errorCode: string | null;
  loaded: boolean;
};

export type RobotDevice = {
  deviceId: string;
  connectionId: string;
  externalId: string;
  name: string;
  type: "AMR" | "AGV";
};

/** 메모리에 들고 있는 로봇 한 대. 아직 수신 전이면 state가 null이다. */
export type RobotEntry = RobotDevice & {
  state: RobotState | null;
  rev: number;
};
