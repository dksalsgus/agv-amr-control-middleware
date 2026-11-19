import { Injectable } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { METRICS_PROCESS_SAMPLE_INTERVAL_MS } from "../config/metrics.config";
import { AppLogger } from "../logger/app-logger";
import { MetricsService } from "./metrics.service";

@Injectable()
export class MetricsScheduler {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(MetricsScheduler.name);
  }

  @Interval(METRICS_PROCESS_SAMPLE_INTERVAL_MS)
  async sample(): Promise<void> {
    try {
      await this.metricsService.sampleProcess();
    } catch (error) {
      this.logger.warn(`프로세스 사용량 기록 실패: ${String(error)}`);
    }
  }
}
