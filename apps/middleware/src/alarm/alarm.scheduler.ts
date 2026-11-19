import { Injectable } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { ALARM_EVALUATE_INTERVAL_MS } from "../config/alarm.config";
import { AppLogger } from "../logger/app-logger";
import { AlarmService } from "./alarm.service";

@Injectable()
export class AlarmScheduler {
  private evaluating = false;

  constructor(
    private readonly alarmService: AlarmService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AlarmScheduler.name);
  }

  /** 이전 판정이 안 끝났으면 건너뛴다. */
  @Interval(ALARM_EVALUATE_INTERVAL_MS)
  async evaluate(): Promise<void> {
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
