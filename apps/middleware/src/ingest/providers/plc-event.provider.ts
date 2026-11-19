import { Injectable, Logger } from "@nestjs/common";
import { VendorsConnectionsDevicesPlcPointsEventsRepository } from "../../history/vendors-connections-devices-plc-points-events.repository";
import { PlcPointChange } from "./plc-event.types";

/** PLC 점 이벤트 기록과 재시작 복구. 기록 실패는 밖으로 던지지 않는다. */
@Injectable()
export class PlcEventProvider {
  private readonly logger = new Logger(PlcEventProvider.name);
  private failing = false;

  constructor(
    private readonly eventsRepository: VendorsConnectionsDevicesPlcPointsEventsRepository,
  ) {}

  async recordAll(changes: PlcPointChange[]): Promise<void> {
    if (changes.length === 0) {
      return;
    }

    const results = await Promise.allSettled(
      changes.map((change) => this.insert(change)),
    );

    const failure = results.find((result) => result.status === "rejected");
    if (failure) {
      this.markFailed(failure.reason);
      return;
    }

    this.markRecovered();
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

  private async insert(change: PlcPointChange): Promise<void> {
    await this.eventsRepository.insert({
      vendors_connections_devices_plc_points_id: change.pointId,
      value: change.current.value,
      seq: change.current.seq,
      source_ts: change.current.sourceTs,
      received_ts: change.current.receivedTs,
    });
  }

  /** 실패 시작과 회복 때만 로그를 남긴다. */
  private markFailed(error: unknown): void {
    if (!this.failing) {
      this.logger.warn(`PLC 이벤트 기록 실패: ${String(error)}`);
    }

    this.failing = true;
  }

  private markRecovered(): void {
    if (this.failing) {
      this.logger.log("PLC 이벤트 기록 회복");
    }

    this.failing = false;
  }
}
