import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { SchedulerRegistry } from "@nestjs/schedule";
import { ingestConfig } from "../config/ingest.config";
import { AppLogger } from "../logger/app-logger";
import { PollOnce } from "./ingest-scheduler.types";
import { IngestService } from "./ingest.service";
import { PlcIngestService } from "./plc-ingest.service";

/**
 * 수집을 시작하고 주기 작업을 SchedulerRegistry에 건다.
 * 설정 동기화는 고정 주기(interval), 연결별 폴링은 다음 간격이 매번 달라(DOWN이면 늘어남) timeout을 다시 건다.
 */
@Injectable()
export class IngestScheduler
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private static readonly SYNC_JOB = "ingest-sync";

  /** 폴링 중인 연결. 같은 연결에 폴링이 둘 걸리지 않게 한다. */
  private readonly activePolls = new Set<string>();
  private syncing = false;
  private stopped = false;

  constructor(
    @Inject(ingestConfig.KEY)
    private readonly config: ConfigType<typeof ingestConfig>,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly ingestService: IngestService,
    private readonly plcIngestService: PlcIngestService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(IngestScheduler.name);
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.ingestService.start();
    await this.plcIngestService.start();
    await this.startPolls();

    const interval = setInterval(
      () => void this.sync(),
      this.config.syncIntervalMs,
    );
    this.schedulerRegistry.addInterval(IngestScheduler.SYNC_JOB, interval);
  }

  /** 타이머는 schedule 모듈이 지운다. 진행 중이던 폴링이 다시 걸지 않게만 막는다. */
  async onApplicationShutdown(): Promise<void> {
    this.stopped = true;
  }

  /** 재배포 없이 바뀐 설정을 반영한다. 이전 동기화가 안 끝났으면 건너뛴다. */
  private async sync(): Promise<void> {
    if (this.syncing) {
      return;
    }

    this.syncing = true;
    try {
      await this.ingestService.sync();
      await this.plcIngestService.sync();
      await this.startPolls();
    } catch (error) {
      this.logger.warn(`설정 동기화 실패: ${String(error)}`);
    } finally {
      this.syncing = false;
    }
  }

  private async startPolls(): Promise<void> {
    const robotIds = await this.ingestService.findPolledConnectionIds();
    for (const id of robotIds) {
      this.startPoll(id, (connectionId) =>
        this.ingestService.poll(connectionId),
      );
    }

    const plcIds = await this.plcIngestService.findPolledConnectionIds();
    for (const id of plcIds) {
      this.startPoll(id, (connectionId) =>
        this.plcIngestService.poll(connectionId),
      );
    }
  }

  private startPoll(connectionId: string, pollOnce: PollOnce): void {
    if (this.activePolls.has(connectionId)) {
      return;
    }

    this.activePolls.add(connectionId);
    this.schedulePoll(connectionId, pollOnce, 0);
  }

  private schedulePoll(
    connectionId: string,
    pollOnce: PollOnce,
    delayMs: number,
  ): void {
    const timeout = setTimeout(
      () => void this.runPoll(connectionId, pollOnce),
      delayMs,
    );
    this.schedulerRegistry.addTimeout(this.toPollJob(connectionId), timeout);
  }

  /** 한 번 폴링하고 돌려받은 간격 뒤로 다시 건다. 연결이 내려가면(null) 멈춘다. */
  private async runPoll(
    connectionId: string,
    pollOnce: PollOnce,
  ): Promise<void> {
    this.schedulerRegistry.deleteTimeout(this.toPollJob(connectionId));

    const nextDelayMs = await pollOnce(connectionId);
    if (nextDelayMs === null || this.stopped) {
      this.activePolls.delete(connectionId);
      return;
    }

    this.schedulePoll(connectionId, pollOnce, nextDelayMs);
  }

  private toPollJob(connectionId: string): string {
    return `ingest-poll:${connectionId}`;
  }
}
