/** 큐에는 JSON만 들어가므로 시각은 ISO 문자열로 담는다. */
export type TelemetryJobRow = {
  deviceId: string;
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

export type PlcEventJobRow = {
  pointId: string;
  value: boolean;
  seq: number;
  sourceTs: string;
  receivedTs: string;
};

export type HistoryJobData =
  | { kind: "TELEMETRY"; rows: TelemetryJobRow[] }
  | { kind: "PLC_EVENT"; rows: PlcEventJobRow[] };
