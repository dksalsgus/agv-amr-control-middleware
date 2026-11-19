import { Injectable } from "@nestjs/common";
import { HistoryQueueRepository } from "../../history/history-queue.repository";
import { PlcEventJobRow } from "../../history/history-queue.types";
import { VendorsConnectionsDevicesPlcPointsEventsRepository } from "../../history/vendors-connections-devices-plc-points-events.repository";
import { PlcPointChange } from "./plc-event.types";
import { AppLogger } from "../../logger/app-logger";

/** PLC 점 이벤트 기록과 재시작 복구. 큐에 넣기 실패는 밖으로 던지지 않는다. */
@Injectable()
export class PlcEventProvider {
  private failing = false;

  constructor(
    private readonly eventsRepository: VendorsConnectionsDevicesPlcPointsEventsRepository,
    private readonly historyQueueRepository: HistoryQueueRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(PlcEventProvider.name);
  }

  async recordAll(changes: PlcPointChange[]): Promise<void> {
    if (changes.length === 0) {
      return;
    }

    try {
      await this.historyQueueRepository.add({
        kind: "PLC_EVENT",
        rows: changes.map((change) => this.toJobRow(change)),
      });
    } catch (error) {
      this.markFailed(error);
      return;
    }

    this.markRecovered();
  }

  /** 큐 작업이 부른다. 실패는 던져서 큐가 다시 시도하게 한다. */
  async saveAll(rows: PlcEventJobRow[]): Promise<void> {
    await this.eventsRepository.insertMany(
      rows.map((row) => ({
        vendors_connections_devices_plc_points_id: row.pointId,
        value: row.value,
        seq: row.seq,
        source_ts: new Date(row.sourceTs),
        received_ts: new Date(row.receivedTs),
      })),
    );
  }

  async findLatestValues(): Promise<PlcPointChange[]> {
    const rows = await this.eventsRepository.findLatestPerPoint();

    return rows.map((row) => ({
      pointId: row.vendors_connections_devices_plc_points_id,
      current: {
        value: row.value,
        seq: Number(row.seq),
        sourceTs: row.source_ts,
        receivedTs: row.received_ts,
      },
    }));
  }

  private toJobRow(change: PlcPointChange): PlcEventJobRow {
    return {
      pointId: change.pointId,
      value: change.current.value,
      seq: change.current.seq,
      sourceTs: change.current.sourceTs.toISOString(),
      receivedTs: change.current.receivedTs.toISOString(),
    };
  }

  /** 실패 시작과 회복 때만 로그를 남긴다. */
  private markFailed(error: unknown): void {
    if (!this.failing) {
      this.logger.warn(`PLC 이벤트 큐 넣기 실패: ${String(error)}`);
    }

    this.failing = true;
  }

  private markRecovered(): void {
    if (this.failing) {
      this.logger.log("PLC 이벤트 큐 넣기 회복");
    }

    this.failing = false;
  }
}
