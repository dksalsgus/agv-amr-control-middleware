import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Interval } from "@nestjs/schedule";
import { CONNECTION_CHANGED_EVENT } from "../common/events/connection.events";
import {
  INGEST_POLL_TICK_MS,
  INGEST_PUSH_SILENCE_CHECK_MS,
} from "../config/ingest.config";
import { AppLogger } from "../logger/app-logger";
import { PollJob, PollOnce } from "./ingest-scheduler.types";
import { IngestService } from "./ingest.service";
import { PlcIngestService } from "./plc-ingest.service";

/**
 * 수집을 시작하고 주기 작업을 돌린다. 연결 설정은 시작할 때 DB에서 읽고, 그 뒤로는 저장 이벤트가 올 때만 다시 맞춘다.
 * 연결별 폴링은 간격이 매번 달라(DOWN이면 늘어남) 짧은 주기로 돌며 다음 폴링 시각이 된 연결만 폴링한다.
 */
@Injectable()
export class IngestScheduler implements OnApplicationBootstrap {
  /** 연결 id별 폴링 차례 */
  private readonly polls = new Map<string, PollJob>();
  private started = false;
  private syncing = false;
  /** 맞추는 동안 또 저장되면 끝난 뒤 한 번 더 맞춘다. */
  private syncAgain = false;

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
    if (this.syncAgain) {
      await this.sync();
    }
  }

  /** 연결 설정을 저장하면 바로 DB 설정과 맞춘다. 바뀐 연결만 다시 붙는다. */
  @OnEvent(CONNECTION_CHANGED_EVENT, { async: true })
  async onConnectionChanged(): Promise<void> {
    await this.sync();
  }

  /** 시작 중이거나 이미 맞추는 중이면 끝난 뒤 다시 맞추도록 표시만 한다. */
  private async sync(): Promise<void> {
    const isBusy = !this.started || this.syncing;
    if (isBusy) {
      this.syncAgain = true;
      return;
    }

    this.syncing = true;
    try {
      await this.syncUntilSettled();
    } finally {
      this.syncing = false;
    }
  }

  private async syncUntilSettled(): Promise<void> {
    this.syncAgain = false;
    try {
      await this.ingestService.sync();
      await this.plcIngestService.sync();
    } catch (error) {
      this.logger.warn(`설정 반영 실패: ${String(error)}`);
    }

    if (this.syncAgain) {
      await this.syncUntilSettled();
    }
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
