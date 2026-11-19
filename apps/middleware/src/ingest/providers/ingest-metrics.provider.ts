import { Injectable } from "@nestjs/common";
import { IngestMetricsRepository } from "../../state/ingest-metrics.repository";
import { SeqJudgement } from "./seq-judge.types";

/** seq 판정 결과를 측정용으로 센다(설계 문서 6장 측정 방법). */
@Injectable()
export class IngestMetricsProvider {
  /** 백분위는 최근 이만큼의 표본으로 낸다. */
  private static readonly MAX_LATENCY_SAMPLES = 5000;

  constructor(
    private readonly ingestMetricsRepository: IngestMetricsRepository,
  ) {}

  async record(
    key: string,
    judgement: SeqJudgement,
    sourceTs: Date,
    receivedTs: Date,
  ): Promise<void> {
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
