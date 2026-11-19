import { Inject, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { SchedulerRegistry } from "@nestjs/schedule";
import { alarmConfig } from "../config/alarm.config";
import { AppLogger } from "../logger/app-logger";
import { AlarmService } from "./alarm.service";

@Injectable()
export class AlarmScheduler implements OnApplicationBootstrap {
  private static readonly EVALUATE_JOB = "alarm-evaluate";

  private evaluating = false;

  constructor(
    @Inject(alarmConfig.KEY)
    private readonly config: ConfigType<typeof alarmConfig>,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly alarmService: AlarmService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AlarmScheduler.name);
  }

  onApplicationBootstrap(): void {
    const interval = setInterval(
      () => void this.evaluate(),
      this.config.evaluateIntervalMs,
    );
    this.schedulerRegistry.addInterval(AlarmScheduler.EVALUATE_JOB, interval);
  }

  /** 이전 판정이 안 끝났으면 건너뛴다. */
  private async evaluate(): Promise<void> {
    if (this.evaluating) {
      return;
    }

    this.evaluating = true;
    try {
      await this.alarmService.evaluate();
    } catch (error) {
      this.logger.warn(`알람 판정 실패: ${String(error)}`);
    } finally {
      this.evaluating = false;
    }
  }
}
