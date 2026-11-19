import { Injectable } from "@nestjs/common";
import { SeqPoint, SeqJudgement } from "./seq-judge.types";

/** 장비별 seq 판정 (설계 문서 6장) */
@Injectable()
export class SeqJudgeProvider {
  /** seq가 줄어도 sourceTs가 이만큼 앞서면 장비 재시작으로 본다. */
  private static readonly RESTART_THRESHOLD_MS = 5000;

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
    return aheadMs >= SeqJudgeProvider.RESTART_THRESHOLD_MS;
  }
}
