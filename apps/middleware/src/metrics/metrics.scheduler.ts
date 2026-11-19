import { Inject, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { SchedulerRegistry } from "@nestjs/schedule";
import { metricsConfig } from "../config/metrics.config";
import { AppLogger } from "../logger/app-logger";
import { MetricsService } from "./metrics.service";

@Injectable()
export class MetricsScheduler implements OnApplicationBootstrap {
  private static readonly SAMPLE_JOB = "metrics-process-sample";

  constructor(
    @Inject(metricsConfig.KEY)
    private readonly config: ConfigType<typeof metricsConfig>,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly metricsService: MetricsService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(MetricsScheduler.name);
  }

  onApplicationBootstrap(): void {
    const interval = setInterval(
      () => void this.sample(),
      this.config.processSampleIntervalMs,
    );
    this.schedulerRegistry.addInterval(MetricsScheduler.SAMPLE_JOB, interval);
  }

  private async sample(): Promise<void> {
    try {
      await this.metricsService.sampleProcess();
    } catch (error) {
      this.logger.warn(`프로세스 사용량 기록 실패: ${String(error)}`);
    }
  }
}
