import { Injectable } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { RETENTION_CLEANUP_INTERVAL_MS } from "../config/retention.config";
import { AppLogger } from "../logger/app-logger";
import { RetentionService } from "./retention.service";

/** 1시간마다 보관 기간이 지난 이력을 지운다. */
@Injectable()
export class RetentionScheduler {
  constructor(
    private readonly retentionService: RetentionService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(RetentionScheduler.name);
  }

  @Interval(RETENTION_CLEANUP_INTERVAL_MS)
  async cleanup(): Promise<void> {
    try {
      const result = await this.retentionService.cleanup(new Date());
      this.logger.log(
        `보관 기간 정리: telemetry ${result.telemetry}행, PLC 이벤트 ${result.plcEvents}행, 로그 ${result.logs}행`,
      );
    } catch (error) {
      this.logger.warn(`보관 기간 정리 실패: ${String(error)}`);
    }
  }
}
