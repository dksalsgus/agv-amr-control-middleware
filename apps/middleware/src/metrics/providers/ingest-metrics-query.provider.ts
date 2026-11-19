import { Injectable } from "@nestjs/common";
import { IngestMetricsEntry } from "../../state/ingest-metrics";
import { IngestMetricsRepository } from "../../state/ingest-metrics.repository";

@Injectable()
export class IngestMetricsQueryProvider {
  constructor(
    private readonly ingestMetricsRepository: IngestMetricsRepository,
  ) {}

  async findAll(): Promise<IngestMetricsEntry[]> {
    return await this.ingestMetricsRepository.findAll();
  }

  async findSince(): Promise<Date> {
    return await this.ingestMetricsRepository.findSince();
  }

  async clear(): Promise<void> {
    await this.ingestMetricsRepository.clear();
  }
}
