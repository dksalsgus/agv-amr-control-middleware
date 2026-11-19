import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { HISTORY_QUEUE } from "../history/history-queue.constants";
import { HistoryJobData } from "../history/history-queue.types";
import { AppLogger } from "../logger/app-logger";
import { HistoryService } from "./history.service";

/** 이력 저장 작업을 DB에 쓴다. 실패한 작업은 큐가 다시 시도한다. */
@Processor(HISTORY_QUEUE)
export class HistoryProcessor extends WorkerHost {
  private failing = false;

  constructor(
    private readonly historyService: HistoryService,
    private readonly logger: AppLogger,
  ) {
    super();
    this.logger.setContext(HistoryProcessor.name);
  }

  async process(job: Job<HistoryJobData>): Promise<void> {
    await this.historyService.save(job.data);
  }

  /** 실패 시작과 회복 때만 로그를 남긴다. */
  @OnWorkerEvent("failed")
  onFailed(_job: Job<HistoryJobData> | undefined, error: Error): void {
    if (!this.failing) {
      this.logger.warn(`이력 저장 실패, 다시 시도: ${error.message.trim()}`);
    }
    this.failing = true;
  }

  @OnWorkerEvent("completed")
  onCompleted(): void {
    if (this.failing) {
      this.logger.log("이력 저장 회복");
    }
    this.failing = false;
  }
}
