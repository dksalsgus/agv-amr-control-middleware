/** 연결 상태. 첫 성공이나 끊김 판정 전에는 UNKNOWN */
export const LINK_STATUSES = ["UNKNOWN", "UP", "DOWN"] as const;
export type LinkStatus = (typeof LINK_STATUSES)[number];

export type LinkState = {
  status: LinkStatus;
  changedAt: Date | null;
  /** 연속 실패 횟수. 성공하면 0 */
  failureCount: number;
};
