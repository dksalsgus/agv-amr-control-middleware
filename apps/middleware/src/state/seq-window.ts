/** 연결 하나의 1초 동안 seq 판정 건수 */
export type SeqWindowBucket = {
  /** 초 단위 시각(ms를 1000으로 나눈 몫) */
  second: number;
  received: number;
  duplicates: number;
  outOfOrder: number;
  missed: number;
};

export type SeqWindowCounts = Omit<SeqWindowBucket, "second">;
