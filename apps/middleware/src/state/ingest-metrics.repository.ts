import { Injectable } from "@nestjs/common";
import { IngestMetricsEntry } from "./ingest-metrics";

@Injectable()
export class IngestMetricsRepository {
  private readonly entries = new Map<string, IngestMetricsEntry>();
  private since = new Date();

  async findOrCreate(key: string): Promise<IngestMetricsEntry> {
    const found = this.entries.get(key);
    if (found) {
      return found;
    }

    const created: IngestMetricsEntry = {
      key,
      received: 0,
      accepted: 0,
      duplicates: 0,
      outOfOrder: 0,
      missed: 0,
      latenciesMs: [],
    };
    this.entries.set(key, created);
    return created;
  }

  async findAll(): Promise<IngestMetricsEntry[]> {
    return Array.from(this.entries.values());
  }

  async findSince(): Promise<Date> {
    return this.since;
  }

  async clear(): Promise<void> {
    this.entries.clear();
    this.since = new Date();
  }
}
