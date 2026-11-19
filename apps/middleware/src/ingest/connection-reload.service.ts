import { Injectable } from "@nestjs/common";
import { IngestService } from "./ingest.service";
import { PlcIngestService } from "./plc-ingest.service";
import { SerialQueue } from "./serial-queue";

/**
 * 연결 설정 API가 저장한 연결 하나를 수집에 바로 반영한다.
 * 같은 연결을 동시에 다시 붙이지 않도록 연결별로 차례대로 실행한다.
 * 연결이 로봇용인지 PLC용인지는 각 수집 Service가 판단하고, 맡지 않는 연결이면 아무것도 하지 않는다.
 */
@Injectable()
export class ConnectionReloadService {
  private readonly queues = new Map<string, SerialQueue>();

  constructor(
    private readonly ingestService: IngestService,
    private readonly plcIngestService: PlcIngestService,
  ) {}

  /** 추가하거나 고친 연결을 새 설정으로 다시 붙인다. 꺼졌으면 뗀다. */
  async reloadConnection(id: string): Promise<void> {
    await this.findQueue(id).run(async () => {
      await this.ingestService.reloadConnection(id);
      await this.plcIngestService.reloadConnection(id);
    });
  }

  /** 지운 연결을 뗀다. */
  async removeConnection(id: string): Promise<void> {
    await this.findQueue(id).run(async () => {
      await this.ingestService.removeConnection(id);
      await this.plcIngestService.removeConnection(id);
    });
    this.queues.delete(id);
  }

  private findQueue(id: string): SerialQueue {
    const queue = this.queues.get(id) ?? new SerialQueue();
    this.queues.set(id, queue);
    return queue;
  }
}
