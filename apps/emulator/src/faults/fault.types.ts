export const FAULT_GROUPS = ["A", "B", "C", "PLC"] as const;
export type FaultGroup = (typeof FAULT_GROUPS)[number];

/** 장비 값 주입 상태: 켠 PLC 점 번호, 오류를 넣은 로봇 serial */
export type DeviceFaults = {
  plcPointsOn: number[];
  robotErrors: string[];
};

/** 제조사 그룹 하나에 거는 장애. 비율은 0~100(%) */
export type FaultConfig = {
  disconnected: boolean;
  delayMs: number;
  duplicatePct: number;
  reorderPct: number;
  lossPct: number;
};
