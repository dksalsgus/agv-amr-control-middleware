import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { linkQualityConfig } from "../config/link-quality.config";
import { percentile, round2 } from "../common/utils/percentile.util";
import { IngestMetricsEntry } from "../state/ingest-metrics";
import { ProcessSample } from "../state/process-metrics";
import { GetMetricsConnectionsItemDto } from "./dto/get-metrics-connections.item.dto";
import { GetMetricsConnectionsResponseDto } from "./dto/get-metrics-connections.response.dto";
import { GetMetricsIngestItemDto } from "./dto/get-metrics.ingest-item.dto";
import { GetMetricsProcessDto } from "./dto/get-metrics.process.dto";
import { GetMetricsResponseDto } from "./dto/get-metrics.response.dto";
import { PostMetricsResetResponseDto } from "./dto/post-metrics-reset.response.dto";
import { ConnectionStatsProvider } from "./providers/connection-stats.provider";
import { IngestMetricsQueryProvider } from "./providers/ingest-metrics-query.provider";
import { ProcessMetricsProvider } from "./providers/process-metrics.provider";

@Injectable()
export class MetricsService {
  constructor(
    private readonly ingestMetricsQueryProvider: IngestMetricsQueryProvider,
    private readonly processMetricsProvider: ProcessMetricsProvider,
    private readonly connectionStatsProvider: ConnectionStatsProvider,
    @Inject(linkQualityConfig.KEY)
    private readonly linkQuality: ConfigType<typeof linkQualityConfig>,
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

  /** 연결별 최근 구간(LINK_LOSS와 같은 30초)의 받음, 중복, 늦음 건수와 유실률 */
  async getConnectionStats(
    now: Date,
  ): Promise<GetMetricsConnectionsResponseDto> {
    const since = new Date(now.getTime() - this.linkQuality.windowMs);
    const ids = await this.connectionStatsProvider.findConnectionIds();

    const connections: GetMetricsConnectionsItemDto[] = [];
    for (const connectionId of ids) {
      const seq = await this.connectionStatsProvider.sumSeqSince(
        connectionId,
        since,
      );
      const loss = await this.connectionStatsProvider.sumLossSince(
        connectionId,
        since,
      );
      const hasEnoughSamples = loss.expected >= this.linkQuality.minExpected;
      connections.push({
        connectionId,
        received: seq.received,
        duplicates: seq.duplicates,
        outOfOrder: seq.outOfOrder,
        lossPct: hasEnoughSamples
          ? round2((loss.lost / loss.expected) * 100)
          : null,
      });
    }

    return { windowSec: this.linkQuality.windowMs / 1000, connections };
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
