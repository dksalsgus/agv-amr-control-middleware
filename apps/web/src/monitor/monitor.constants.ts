import { VendorKey } from "./monitor.types";

/** 공장 맵 크기(m). 에뮬레이터와 같다. */
export const MAP_WIDTH_M = 50;
export const MAP_HEIGHT_M = 30;

export const OP_STATES = ["MOVING", "IDLE", "CHARGING", "PAUSED", "ERROR"];
export const FILTER_STATES = OP_STATES.concat("STALE");

export const OP_LABEL: Record<string, string> = {
  IDLE: "대기",
  MOVING: "주행",
  CHARGING: "충전",
  PAUSED: "일시정지",
  ERROR: "오류",
  STALE: "끊김",
};

export const OP_TONE: Record<string, string> = {
  MOVING: "ok",
  IDLE: "neutral",
  CHARGING: "info",
  PAUSED: "warn",
  ERROR: "danger",
};

export const ALARM_LABEL: Record<string, string> = {
  ROBOT_ERROR: "로봇 오류",
  DEVICE_STALE: "데이터 끊김",
  PLC_ABNORMAL: "PLC 비정상",
  LOW_BATTERY: "배터리 부족",
  LINK_LOSS: "통신 품질 저하",
};

export const SEV_RANK: Record<string, number> = {
  CRITICAL: 3,
  WARN: 2,
  INFO: 1,
};

export const VENDOR_KEYS: VendorKey[] = ["A", "B", "C"];

export const VENDOR_LABEL: Record<VendorKey, string> = {
  A: "A · AMR",
  B: "B · AGV",
  C: "C · AGV",
};

/** 미들웨어 vendorCode → 맵 마커 모양 */
export const VENDOR_KEY_BY_CODE: Record<string, VendorKey> = {
  VENDOR_A: "A",
  VENDOR_B: "B",
  VENDOR_C: "C",
};

/** 종단 지연 p95가 이 값을 넘으면 경고색 */
export const P95_WARN_MS = 300;

/** 맵에 그리는 PLC 점의 위치(m). 점 번호 기준이고, 위치가 없는 점은 맵에 그리지 않는다. */
export const PLC_POSITIONS: Record<number, { x: number; y: number }> = {
  0: { x: 0, y: 6.5 },
  1: { x: 0, y: 20.5 },
  2: { x: 50, y: 6.5 },
  3: { x: 50, y: 20.5 },
  4: { x: 12, y: 10 },
  5: { x: 21, y: 17 },
  6: { x: 30, y: 10 },
  7: { x: 39, y: 17 },
  8: { x: 7.5, y: 29.2 },
  9: { x: 25.5, y: 29.2 },
};

/** 맵에 적는 PLC 점 머리글자. 유형별 순번을 붙여 D1, X2처럼 쓴다. */
export const PLC_TAG: Record<string, string> = {
  DOOR: "D",
  INTERSECTION: "X",
  ESTOP: "E",
};

/** 맵 바닥 그림: 세로·가로 통로 위치(m)와 충전기 자리 */
export const AISLE_X = [3, 12, 21, 30, 39, 47];
export const AISLE_Y = [3, 10, 17, 24, 27.5];
export const CHARGERS = Array.from({ length: 8 }, (_, k) => ({
  x: 33 + k * 1.6,
  y: 1.1,
}));

/** 맵을 다시 그리는 주기. 서버 delta 주기와 같다. */
export const MAP_TICK_MS = 100;

/** 연결별 받음·중복·늦음 건수를 다시 받아 오는 주기 */
export const CONNECTION_STATS_POLL_MS = 2000;
