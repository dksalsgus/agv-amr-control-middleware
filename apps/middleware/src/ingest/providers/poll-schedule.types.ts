export type PollOnce = (connectionId: string) => Promise<number | null>;

/** 연결 하나의 폴링 차례 */
export type PollJob = {
  pollOnce: PollOnce;
  /** 다음 폴링을 시작할 시각(ms) */
  nextAt: number;
  running: boolean;
};
