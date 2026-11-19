import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import {
  INGEST_POLL_TICK_MS,
  INGEST_PUSH_SILENCE_CHECK_MS,
} from "../config/ingest.config";
import { AppLogger } from "../logger/app-logger";
import { PollJob, PollOnce } from "./ingest-scheduler.types";
import { IngestService } from "./ingest.service";
import { PlcIngestService } from "./plc-ingest.service";

/**
 * 수집을 시작하고 주기 작업을 돌린다. 연결을 붙이고 떼는 일은 수집 Service가 맡고, 여기서는 폴링 차례만 관리한다.
 * 연결별 폴링은 간격이 매번 달라(DOWN이면 늘어남) 짧은 주기로 돌며 다음 폴링 시각이 된 연결만 폴링한다.
 */
@Injectable()
export class IngestScheduler implements OnApplicationBootstrap {
  /** 연결 id별 폴링 차례 */
  private readonly polls = new Map<string, PollJob>();
  private started = false;

  constructor(
    private readonly ingestService: IngestService,
    private readonly plcIngestService: PlcIngestService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(IngestScheduler.name);
  }

  /** 주기 작업은 수집 시작이 끝난 뒤부터 일한다. */
  async onApplicationBootstrap(): Promise<void> {
    await this.ingestService.start();
    await this.plcIngestService.start();
    this.started = true;
  }

  @Interval(INGEST_PUSH_SILENCE_CHECK_MS)
  async checkPushSilence(): Promise<void> {
    if (!this.started) {
      return;
    }

    try {
      await this.ingestService.checkPushSilence();
    } catch (error) {
      this.logger.warn(`MQTT 수신 확인 실패: ${String(error)}`);
    }
  }

  /** 새 연결은 차례에 넣고, 다음 폴링 시각이 된 연결만 폴링한다. */
  @Interval(INGEST_POLL_TICK_MS)
  async pollDue(): Promise<void> {
    if (!this.started) {
      return;
    }

    await this.addPolls();

    const now = Date.now();
    for (const [connectionId, job] of this.polls) {
      const isDue = !job.running && job.nextAt <= now;
      if (isDue) {
        void this.runPoll(connectionId, job);
      }
    }
  }

  private async addPolls(): Promise<void> {
    const robotIds = await this.ingestService.findPolledConnectionIds();
    for (const id of robotIds) {
      this.addPoll(id, (connectionId) => this.ingestService.poll(connectionId));
    }

    const plcIds = await this.plcIngestService.findPolledConnectionIds();
    for (const id of plcIds) {
      this.addPoll(id, (connectionId) =>
        this.plcIngestService.poll(connectionId),
      );
    }
  }

  private addPoll(connectionId: string, pollOnce: PollOnce): void {
    if (this.polls.has(connectionId)) {
      return;
    }

    this.polls.set(connectionId, {
      pollOnce,
      nextAt: Date.now(),
      running: false,
    });
  }

  /** 한 번 폴링하고 돌려받은 간격으로 다음 시각을 정한다. 연결이 내려가면(null) 차례에서 뺀다. */
  private async runPoll(connectionId: string, job: PollJob): Promise<void> {
    job.running = true;
    try {
      const nextDelayMs = await job.pollOnce(connectionId);
      if (nextDelayMs === null) {
        this.polls.delete(connectionId);
        return;
      }

      job.nextAt = Date.now() + nextDelayMs;
    } finally {
      job.running = false;
    }
  }
}
