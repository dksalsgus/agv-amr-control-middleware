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

/** seq가 줄어도 sourceTs가 이만큼 앞서면 장비 재시작으로 본다. */
const RESTART_THRESHOLD_MS = 5000;

/** 장비별 seq 판정 (설계 문서 6장) */
@Injectable()
export class SeqJudgeProvider {
  async judge(last: SeqPoint | null, next: SeqPoint): Promise<SeqJudgement> {
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

    if (await this.isRestart(last, next)) {
      return { verdict: "RESTART", accept: true, missed: 0 };
    }

    return { verdict: "OUT_OF_ORDER", accept: false, missed: 0 };
  }

  private async isRestart(last: SeqPoint, next: SeqPoint): Promise<boolean> {
    const aheadMs = next.sourceTs.getTime() - last.sourceTs.getTime();
    return aheadMs >= RESTART_THRESHOLD_MS;
  }
}
