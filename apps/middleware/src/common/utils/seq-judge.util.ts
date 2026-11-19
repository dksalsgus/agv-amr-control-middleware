import { SeqJudgement, SeqPoint } from "./seq-judge.types";

/** 장비별 seq 판정 (설계 문서 6장). seq가 줄었어도 sourceTs가 restartThresholdMs 이상 앞서면 장비 재시작으로 본다. */
export const judgeSeq = (
  last: SeqPoint | null,
  next: SeqPoint,
  restartThresholdMs: number,
): SeqJudgement => {
  if (!last) {
    return { verdict: "FIRST", accept: true, missed: 0 };
  }

  if (next.seq === last.seq + 1) {
    return { verdict: "NORMAL", accept: true, missed: 0 };
  }

  if (next.seq > last.seq + 1) {
    const missed = next.seq - last.seq - 1;
    return { verdict: "GAP", accept: true, missed };
  }

  if (next.seq === last.seq) {
    return { verdict: "DUPLICATE", accept: false, missed: 0 };
  }

  const aheadMs = next.sourceTs.getTime() - last.sourceTs.getTime();
  const isRestart = aheadMs >= restartThresholdMs;
  if (isRestart) {
    return { verdict: "RESTART", accept: true, missed: 0 };
  }

  return { verdict: "OUT_OF_ORDER", accept: false, missed: 0 };
};
