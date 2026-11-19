import { InjectQueue } from "@nestjs/bullmq";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { Queue } from "bullmq";
import { queueConfig } from "../config/queue.config";
import { HISTORY_QUEUE } from "./history-queue.constants";
import { HistoryJobData } from "./history-queue.types";

/** 이력 저장 작업을 Redis에 넣는다. DB가 멈춰도 작업은 Redis에 남아 다시 시도된다. */
@Injectable()
export class HistoryQueueRepository {
  constructor(
    @Inject(queueConfig.KEY)
    private readonly config: ConfigType<typeof queueConfig>,
    @InjectQueue(HISTORY_QUEUE)
    private readonly queue: Queue<HistoryJobData>,
  ) {}

  async add(data: HistoryJobData): Promise<void> {
    await this.queue.add(data.kind, data, {
      attempts: this.config.maxAttempts,
      backoff: { type: "fixed", delay: this.config.retryDelayMs },
      removeOnComplete: true,
      removeOnFail: this.config.keepFailedJobs,
    });
  }
}
