import { Injectable, Inject } from "@nestjs/common";
import { SeqPoint, SeqJudgement } from "./seq-judge.types";
import { ingestConfig } from "../../config/ingest.config";
import { ConfigType } from "@nestjs/config";

/** 장비별 seq 판정 (설계 문서 6장) */
@Injectable()
export class SeqJudgeProvider {
  constructor(
    @Inject(ingestConfig.KEY)
    private readonly config: ConfigType<typeof ingestConfig>,
  ) {}

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

    if (this.isRestart(last, next)) {
      return { verdict: "RESTART", accept: true, missed: 0 };
    }

    return { verdict: "OUT_OF_ORDER", accept: false, missed: 0 };
  }

  private isRestart(last: SeqPoint, next: SeqPoint): boolean {
    const aheadMs = next.sourceTs.getTime() - last.sourceTs.getTime();
    return aheadMs >= this.config.restartThresholdMs;
  }
}
