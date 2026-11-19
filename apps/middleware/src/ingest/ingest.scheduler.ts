import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from "@nestjs/common";
import { delay } from "../common/utils/delay.util";
import { IngestService } from "./ingest.service";
import { PlcIngestService } from "./plc-ingest.service";
import { PollOnce } from "./ingest-scheduler.types";
import { AppLogger } from "../logger/app-logger";

/** 수집을 시작하고 폴링 연결마다 루프를 돌린다. 느린 연결이 다른 연결을 막지 않는다. */
@Injectable()
export class IngestScheduler
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  /** 연결 설정 변경(DB)을 확인하는 간격 */
  private static readonly SYNC_INTERVAL_MS = 2000;

  private running = false;
  private readonly loops: Promise<void>[] = [];
  /** 폴링 루프가 돌고 있는 연결. 같은 연결에 루프가 둘 생기지 않게 한다. */
  private readonly activeLoops = new Set<string>();

  constructor(
    private readonly ingestService: IngestService,
    private readonly plcIngestService: PlcIngestService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(IngestScheduler.name);
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.ingestService.start();
    await this.plcIngestService.start();

    this.running = true;
    await this.startPollLoops();
    this.loops.push(this.runSyncLoop());
  }

  async onApplicationShutdown(): Promise<void> {
    this.running = false;
    await Promise.all(this.loops);
  }

  /** 재배포 없이 바뀐 설정을 반영한다. 새로 생긴 폴링 연결은 루프를 띄운다. */
  private async runSyncLoop(): Promise<void> {
    while (this.running) {
      await delay(IngestScheduler.SYNC_INTERVAL_MS);
      await this.sync();
      await this.startPollLoops();
    }
  }

  private async sync(): Promise<void> {
    try {
      await this.ingestService.sync();
      await this.plcIngestService.sync();
    } catch (error) {
      this.logger.warn(`설정 동기화 실패: ${String(error)}`);
    }
  }

  private async startPollLoops(): Promise<void> {
    const robotIds = await this.ingestService.findPolledConnectionIds();
    for (const id of robotIds) {
      this.startLoop(id, (connectionId) =>
        this.ingestService.poll(connectionId),
      );
    }

    const plcIds = await this.plcIngestService.findPolledConnectionIds();
    for (const id of plcIds) {
      this.startLoop(id, (connectionId) =>
        this.plcIngestService.poll(connectionId),
      );
    }
  }

  private startLoop(connectionId: string, pollOnce: PollOnce): void {
    if (this.activeLoops.has(connectionId)) {
      return;
    }

    this.activeLoops.add(connectionId);
    this.loops.push(this.runLoop(connectionId, pollOnce));
  }

  /** 연결이 내려가면(poll이 null) 끝난다. */
  private async runLoop(connectionId: string, pollOnce: PollOnce) {
    while (this.running) {
      const nextDelayMs = await pollOnce(connectionId);
      if (nextDelayMs === null) {
        break;
      }

      await delay(nextDelayMs);
    }

    this.activeLoops.delete(connectionId);
  }
}
