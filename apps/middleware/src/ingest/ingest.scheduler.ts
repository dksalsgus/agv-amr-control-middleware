import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from "@nestjs/common";
import { IngestService } from "./ingest.service";
import { PlcIngestService } from "./plc-ingest.service";

/** 폴링 주기를 확인하는 간격. 연결별 주기(500ms, 1000ms)보다 충분히 짧게 둔다. */
const TICK_MS = 50;

/**
 * Controller 위치의 스케줄러. 앱이 뜨면 수집을 시작시키고, 짧은 간격으로 Service에 폴링할 차례인지 묻는다.
 * 연결별 타이머를 두지 않으므로 연결 설정이 바뀌어도 다시 예약할 필요가 없다.
 */
@Injectable()
export class IngestScheduler
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly ingestService: IngestService,
    private readonly plcIngestService: PlcIngestService,
  ) {}

  async onApplicationBootstrap() {
    await this.ingestService.start();
    await this.plcIngestService.start();

    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  onApplicationShutdown() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private tick() {
    const now = Date.now();
    this.ingestService.pollDue(now);
    this.plcIngestService.pollDue(now);
  }
}
