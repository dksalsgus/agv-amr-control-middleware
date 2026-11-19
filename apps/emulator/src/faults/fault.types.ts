export const FAULT_GROUPS = ["A", "B", "C", "PLC"] as const;
export type FaultGroup = (typeof FAULT_GROUPS)[number];

/** 제조사 그룹 하나에 거는 장애. 비율은 0~100(%) */
export type FaultConfig = {
  disconnected: boolean;
  delayMs: number;
  duplicatePct: number;
  reorderPct: number;
  lossPct: number;
};
