import { Injectable } from "@nestjs/common";
import { percentile, round2 } from "../common/utils/percentile.util";
import { IngestMetricsEntry } from "../state/ingest-metrics";
import { ProcessSample } from "../state/process-metrics";
import { GetMetricsIngestItemDto } from "./dto/get-metrics.ingest-item.dto";
import { GetMetricsProcessDto } from "./dto/get-metrics.process.dto";
import { GetMetricsResponseDto } from "./dto/get-metrics.response.dto";
import { PostMetricsResetResponseDto } from "./dto/post-metrics-reset.response.dto";
import { IngestMetricsQueryProvider } from "./providers/ingest-metrics-query.provider";
import { ProcessMetricsProvider } from "./providers/process-metrics.provider";

@Injectable()
export class MetricsService {
  constructor(
    private readonly ingestMetricsQueryProvider: IngestMetricsQueryProvider,
    private readonly processMetricsProvider: ProcessMetricsProvider,
  ) {}

  async sampleProcess(): Promise<void> {
    await this.processMetricsProvider.sample();
  }

  async getMetrics(): Promise<GetMetricsResponseDto> {
    const since = await this.ingestMetricsQueryProvider.findSince();
    const entries = await this.ingestMetricsQueryProvider.findAll();
    const samples = await this.processMetricsProvider.findAfter(since);

    return {
      since: since.toISOString(),
      ingest: entries
        .map((entry) => this.toIngestItem(entry))
        .sort((a, b) => a.key.localeCompare(b.key)),
      process: this.toProcess(samples),
    };
  }

  async reset(): Promise<PostMetricsResetResponseDto> {
    await this.ingestMetricsQueryProvider.clear();
    const since = await this.ingestMetricsQueryProvider.findSince();
    return { since: since.toISOString() };
  }

  private toIngestItem(entry: IngestMetricsEntry): GetMetricsIngestItemDto {
    const expected = entry.accepted + entry.missed;

    return {
      key: entry.key,
      received: entry.received,
      accepted: entry.accepted,
      duplicates: entry.duplicates,
      outOfOrder: entry.outOfOrder,
      missed: entry.missed,
      lossPct: expected === 0 ? 0 : round2((entry.missed / expected) * 100),
      latencyP50Ms: percentile(entry.latenciesMs, 50),
      latencyP95Ms: percentile(entry.latenciesMs, 95),
      latencySamples: entry.latenciesMs.length,
    };
  }

  private toProcess(samples: ProcessSample[]): GetMetricsProcessDto {
    const latest = samples.at(-1);
    const cpus = samples.map((sample) => sample.cpuPct);
    const rssList = samples.map((sample) => sample.rssMb);

    return {
      samples: samples.length,
      cpuAvgPct:
        cpus.length === 0
          ? null
          : round2(cpus.reduce((sum, cpu) => sum + cpu, 0) / cpus.length),
      cpuMaxPct: this.max(cpus),
      rssLatestMb: latest?.rssMb ?? null,
      rssMaxMb: this.max(rssList),
      heapUsedLatestMb: latest?.heapUsedMb ?? null,
    };
  }

  private max(values: number[]): number | null {
    if (values.length === 0) {
      return null;
    }
    return values.reduce((a, b) => Math.max(a, b));
  }
}
