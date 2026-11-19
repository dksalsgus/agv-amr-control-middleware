import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { retentionConfig } from "../config/retention.config";
import { HistoryCleanupProvider } from "./providers/history-cleanup.provider";
import { RetentionResult } from "./retention.types";

/** 보관 기간이 지난 이력을 지운다. 기간은 retention.config.ts */
@Injectable()
export class RetentionService {
  constructor(
    @Inject(retentionConfig.KEY)
    private readonly config: ConfigType<typeof retentionConfig>,
    private readonly historyCleanupProvider: HistoryCleanupProvider,
  ) {}

  async cleanup(now: Date): Promise<RetentionResult> {
    return {
      telemetry: await this.historyCleanupProvider.deleteTelemetry(
        this.toCutoff(now, this.config.telemetryMs),
      ),
      plcEvents: await this.historyCleanupProvider.deletePlcEvents(
        this.toCutoff(now, this.config.plcEventMs),
      ),
      logs: await this.historyCleanupProvider.deleteLogs(
        this.toCutoff(now, this.config.logMs),
      ),
    };
  }

  private toCutoff(now: Date, retentionMs: number): Date {
    return new Date(now.getTime() - retentionMs);
  }
}
