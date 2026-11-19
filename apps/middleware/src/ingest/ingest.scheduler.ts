import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from "@nestjs/common";
import { delay } from "../common/utils/delay.util";
import { IngestService } from "./ingest.service";
import { PlcIngestService } from "./plc-ingest.service";

type PollOnce = (connectionId: string) => Promise<number | null>;

/**
 * Controller 위치의 스케줄러. 수집을 시작하고 폴링 연결마다 반복을 돌린다.
 * 연결마다 따로 돌아 한 연결이 느려도 다른 연결은 막히지 않는다.
 */
@Injectable()
export class IngestScheduler
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private running = false;
  private loops: Promise<void>[] = [];

  constructor(
    private readonly ingestService: IngestService,
    private readonly plcIngestService: PlcIngestService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.ingestService.start();
    await this.plcIngestService.start();

    this.running = true;

    const robotIds = await this.ingestService.findPolledConnectionIds();
    const plcIds = await this.plcIngestService.findPolledConnectionIds();

    this.loops = [
      ...robotIds.map((id) =>
        this.runLoop(id, (connectionId) =>
          this.ingestService.poll(connectionId),
        ),
      ),
      ...plcIds.map((id) =>
        this.runLoop(id, (connectionId) =>
          this.plcIngestService.poll(connectionId),
        ),
      ),
    ];
  }

  async onApplicationShutdown(): Promise<void> {
    this.running = false;
    await Promise.all(this.loops);
  }

  private async runLoop(connectionId: string, pollOnce: PollOnce) {
    while (this.running) {
      const nextDelayMs = await pollOnce(connectionId);
      if (nextDelayMs === null) {
        return;
      }

      await delay(nextDelayMs);
    }
  }
}
