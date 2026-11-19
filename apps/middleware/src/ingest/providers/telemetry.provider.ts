import { Injectable } from "@nestjs/common";
import { VendorsConnectionsDevicesTelemetryRepository } from "../../history/vendors-connections-devices-telemetry.repository";
import { HistoryQueueRepository } from "../../history/history-queue.repository";
import { TelemetryJobRow } from "../../history/history-queue.types";
import { TelemetryRow } from "../../history/vendors-connections-devices-telemetry.types";
import { RobotOpState, RobotState } from "../../state/robot-state";
import { RobotTelemetry } from "./telemetry.types";
import { AppLogger } from "../../logger/app-logger";

/** 로봇 이력 기록과 재시작 복구. 큐에 넣기 실패는 밖으로 던지지 않는다(Redis 장애가 수집을 멈추면 안 됨). */
@Injectable()
export class TelemetryProvider {
  private failing = false;

  constructor(
    private readonly telemetryRepository: VendorsConnectionsDevicesTelemetryRepository,
    private readonly historyQueueRepository: HistoryQueueRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(TelemetryProvider.name);
  }

  async recordAll(telemetries: RobotTelemetry[]): Promise<void> {
    if (telemetries.length === 0) {
      return;
    }

    try {
      await this.historyQueueRepository.add({
        kind: "TELEMETRY",
        rows: telemetries.map((telemetry) => this.toJobRow(telemetry)),
      });
    } catch (error) {
      this.markFailed(error);
      return;
    }

    this.markRecovered();
  }

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

  private toJobRow(telemetry: RobotTelemetry): TelemetryJobRow {
    const state = telemetry.state;

    return {
      deviceId: telemetry.deviceId,
      seq: state.seq,
      sourceTs: state.sourceTs.toISOString(),
      receivedTs: state.receivedTs.toISOString(),
      x: state.x,
      y: state.y,
      theta: state.theta,
      speed: state.speed,
      batteryPct: state.batteryPct,
      opState: state.opState,
      errorCode: state.errorCode,
      loaded: state.loaded,
    };
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

  /** 실패 시작과 회복 때만 로그를 남긴다. */
  private markFailed(error: unknown): void {
    if (!this.failing) {
      this.logger.warn(`이력 큐 넣기 실패: ${String(error)}`);
    }

    this.failing = true;
  }

  private markRecovered(): void {
    if (this.failing) {
      this.logger.log("이력 큐 넣기 회복");
    }

    this.failing = false;
  }
}
