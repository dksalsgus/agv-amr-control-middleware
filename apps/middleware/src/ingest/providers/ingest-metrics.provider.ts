import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { linkQualityConfig } from "../../config/link-quality.config";
import { SeqWindowRepository } from "../../state/seq-window.repository";
import { IngestMetricsRepository } from "../../state/ingest-metrics.repository";
import { SeqJudgement } from "../../common/utils/seq-judge.types";

/** seq 판정 결과를 센다. 측정용 누적값(설계 문서 6장)과 관제 화면용 연결별 최근 구간 건수 두 가지다. */
@Injectable()
export class IngestMetricsProvider {
  /** 백분위는 최근 이만큼의 표본으로 낸다. */
  private static readonly MAX_LATENCY_SAMPLES = 5000;

  constructor(
    @Inject(linkQualityConfig.KEY)
    private readonly config: ConfigType<typeof linkQualityConfig>,
    private readonly ingestMetricsRepository: IngestMetricsRepository,
    private readonly seqWindowRepository: SeqWindowRepository,
  ) {}

  async record(
    key: string,
    connectionId: string,
    judgement: SeqJudgement,
    sourceTs: Date,
    receivedTs: Date,
  ): Promise<void> {
    await this.seqWindowRepository.add(
      connectionId,
      receivedTs,
      {
        received: 1,
        duplicates: judgement.verdict === "DUPLICATE" ? 1 : 0,
        outOfOrder: judgement.verdict === "OUT_OF_ORDER" ? 1 : 0,
        missed: judgement.missed,
      },
      this.config.windowMs,
    );

    const entry = await this.ingestMetricsRepository.findOrCreate(key);
    entry.received += 1;
    entry.missed += judgement.missed;

    if (judgement.verdict === "DUPLICATE") {
      entry.duplicates += 1;
    }
    if (judgement.verdict === "OUT_OF_ORDER") {
      entry.outOfOrder += 1;
    }
    if (!judgement.accept) {
      return;
    }

    entry.accepted += 1;
    entry.latenciesMs.push(receivedTs.getTime() - sourceTs.getTime());
    if (entry.latenciesMs.length > IngestMetricsProvider.MAX_LATENCY_SAMPLES) {
      entry.latenciesMs.shift();
    }
  }
}
