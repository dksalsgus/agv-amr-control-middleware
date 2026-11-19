/** plc_points.type 컬럼(varchar)의 허용값 */
export const PLC_POINT_TYPES = [
  "DOOR",
  "INTERSECTION",
  "ESTOP",
  "GENERIC",
] as const;

export type PlcPointType = (typeof PLC_POINT_TYPES)[number];

export type PlcPoint = {
  pointId: string;
  deviceId: string;
  connectionId: string;
  pointNo: number;
  name: string;
  type: PlcPointType;
  normalValue: boolean;
  alarmOnAbnormal: boolean;
};

/** 점의 현재 값. 마지막으로 값이 바뀐 시점의 seq와 시각을 함께 든다. */
export type PlcPointValue = {
  value: boolean;
  seq: number;
  sourceTs: Date;
  receivedTs: Date;
};

export type PlcPointEntry = PlcPoint & {
  current: PlcPointValue | null;
  rev: number;
};
