import { Injectable } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import {
  INGEST_POLL_TICK_MS,
  INGEST_PUSH_SILENCE_CHECK_MS,
} from "../config/ingest.config";
import { AppLogger } from "../logger/app-logger";
import { IngestService } from "./ingest.service";

/** 수집의 주기 작업만 돌린다. 연결을 붙이고 떼는 일과 폴링 차례 관리는 수집 Service가 맡는다. */
@Injectable()
export class IngestScheduler {
  constructor(
    private readonly ingestService: IngestService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(IngestScheduler.name);
  }

  /** 다음 폴링 시각이 된 연결만 폴링한다. */
  @Interval(INGEST_POLL_TICK_MS)
  pollDue(): void {
    this.ingestService.runDuePolls(Date.now());
  }

  /** 기준 시간 넘게 조용한 MQTT 연결을 DOWN으로 바꾼다. */
  @Interval(INGEST_PUSH_SILENCE_CHECK_MS)
  async checkPushSilence(): Promise<void> {
    try {
      await this.ingestService.checkPushSilence();
    } catch (error) {
      this.logger.warn(`MQTT 수신 확인 실패: ${String(error)}`);
    }
  }
}
