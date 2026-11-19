import { Injectable } from "@nestjs/common";
import { PlcEventJobRow } from "../history-queue.types";
import { VendorsConnectionsDevicesPlcPointsEventsRepository } from "../../history/vendors-connections-devices-plc-points-events.repository";
import { PlcPointChange } from "./plc-event.types";

/** PLC 점 이벤트 DB 저장과 재시작 복구 */
@Injectable()
export class PlcEventProvider {
  constructor(
    private readonly eventsRepository: VendorsConnectionsDevicesPlcPointsEventsRepository,
  ) {}

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
}
