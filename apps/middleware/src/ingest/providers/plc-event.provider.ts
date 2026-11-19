import { Injectable, Logger } from "@nestjs/common";
import { VendorsConnectionsDevicesPlcPointsEventsRepository } from "../../history/vendors-connections-devices-plc-points-events.repository";
import { PlcPointValue } from "../../state/plc-point-state";

export type LatestPlcPointValue = {
  pointId: string;
  current: PlcPointValue;
};

/**
 * PLC 점 이벤트 기록과 재시작 복구. 기록은 완료를 기다리지 않는다(설계 문서 6장 저장 흐름).
 */
@Injectable()
export class PlcEventProvider {
  private readonly logger = new Logger(PlcEventProvider.name);
  private failing = false;

  constructor(
    private readonly eventsRepository: VendorsConnectionsDevicesPlcPointsEventsRepository,
  ) {}

  record(pointId: string, current: PlcPointValue) {
    this.eventsRepository
      .insert({
        vendors_connections_devices_plc_points_id: pointId,
        value: current.value,
        seq: current.seq,
        source_ts: current.sourceTs,
        received_ts: current.receivedTs,
      })
      .then(() => this.markRecovered())
      .catch((error: unknown) => this.markFailed(error));
  }

  async findLatestValues(): Promise<LatestPlcPointValue[]> {
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

  private markFailed(error: unknown) {
    if (!this.failing) {
      this.logger.warn(`PLC 이벤트 기록 실패: ${String(error)}`);
    }

    this.failing = true;
  }

  private markRecovered() {
    if (this.failing) {
      this.logger.log("PLC 이벤트 기록 회복");
    }

    this.failing = false;
  }
}
