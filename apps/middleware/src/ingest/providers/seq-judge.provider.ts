import { Injectable } from "@nestjs/common";

export type SeqPoint = {
  seq: number;
  sourceTs: Date;
};

export type SeqVerdict =
  | "FIRST"
  | "NORMAL"
  | "GAP"
  | "DUPLICATE"
  | "OUT_OF_ORDER"
  | "RESTART";

export type SeqJudgement = {
  verdict: SeqVerdict;
  accept: boolean;
  missed: number;
};

/** sourceTs가 이만큼 앞서면 seq가 줄어도 장비 재시작으로 본다. */
const RESTART_THRESHOLD_MS = 5000;

/**
 * 장비별 seq 판정 규칙(설계 문서 6장 "수집 구간: seq 판정 규칙").
 * 마지막으로 받아들인 값과 새 값을 비교해 반영 여부를 정한다.
 */
@Injectable()
export class SeqJudgeProvider {
  judge(last: SeqPoint | null, next: SeqPoint): SeqJudgement {
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

    if (this.isRestart(last, next)) {
      return { verdict: "RESTART", accept: true, missed: 0 };
    }

    return { verdict: "OUT_OF_ORDER", accept: false, missed: 0 };
  }

  private isRestart(last: SeqPoint, next: SeqPoint): boolean {
    const aheadMs = next.sourceTs.getTime() - last.sourceTs.getTime();
    return aheadMs >= RESTART_THRESHOLD_MS;
  }
}
