import { Injectable } from "@nestjs/common";
import { VendorsConnectionsDevicesTelemetryRepository } from "../../history/vendors-connections-devices-telemetry.repository";
import { TelemetryJobRow } from "../history-queue.types";
import { TelemetryRow } from "../../history/vendors-connections-devices-telemetry.types";
import { RobotOpState, RobotState } from "../../state/robot-state";
import { RobotTelemetry } from "./telemetry.types";

/** 로봇 이력 DB 저장과 재시작 복구 */
@Injectable()
export class TelemetryProvider {
  constructor(
    private readonly telemetryRepository: VendorsConnectionsDevicesTelemetryRepository,
  ) {}

  /** 큐 작업이 부른다. 실패는 던져서 큐가 다시 시도하게 한다. */
  async saveAll(rows: TelemetryJobRow[]): Promise<void> {
    await this.telemetryRepository.insertMany(
      rows.map((row) => ({
        vendors_connections_devices_id: row.deviceId,
        seq: row.seq,
        source_ts: new Date(row.sourceTs),
        received_ts: new Date(row.receivedTs),
        x: row.x,
        y: row.y,
        theta: row.theta,
        speed: row.speed,
        battery_pct: row.batteryPct,
        op_state: row.opState,
        error_code: row.errorCode,
        loaded: row.loaded,
      })),
    );
  }

  async findLatestStates(): Promise<RobotTelemetry[]> {
    const rows = await this.telemetryRepository.findLatestPerDevice();

    const latest: RobotTelemetry[] = [];
    for (const row of rows) {
      latest.push({
        deviceId: row.vendors_connections_devices_id,
        state: this.toState(row),
      });
    }

    return latest;
  }

  private toState(row: TelemetryRow): RobotState {
    return {
      seq: Number(row.seq),
      sourceTs: row.source_ts,
      receivedTs: row.received_ts,
      x: row.x,
      y: row.y,
      theta: row.theta,
      speed: row.speed,
      batteryPct: row.battery_pct,
      opState: row.op_state as RobotOpState,
      errorCode: row.error_code,
      loaded: row.loaded,
    };
  }
}
