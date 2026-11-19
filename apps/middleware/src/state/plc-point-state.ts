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

/** PLC 장비 단위로 마지막 받아들인 읽기. seq 판정과 STALE 판정에 쓴다. */
export type PlcDeviceLastRead = {
  seq: number;
  sourceTs: Date;
  receivedTs: Date;
};

export type PlcPointEntry = PlcPoint & {
  current: PlcPointValue | null;
  rev: number;
};
