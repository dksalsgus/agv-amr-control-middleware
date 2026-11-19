import { Injectable } from "@nestjs/common";
import { VendorsConnectionsDevicesTelemetryRepository } from "../../history/vendors-connections-devices-telemetry.repository";
import { TelemetryRow } from "../../history/vendors-connections-devices-telemetry.types";
import { RobotOpState, RobotState } from "../../state/robot-state";
import { RobotTelemetry } from "./telemetry.types";
import { AppLogger } from "../../logger/app-logger";

/** 로봇 이력 기록과 재시작 복구. 기록 실패는 밖으로 던지지 않는다(DB 장애가 수집을 멈추면 안 됨). */
@Injectable()
export class TelemetryProvider {
  private failing = false;

  constructor(
    private readonly telemetryRepository: VendorsConnectionsDevicesTelemetryRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(TelemetryProvider.name);
  }

  async recordAll(telemetries: RobotTelemetry[]): Promise<void> {
    if (telemetries.length === 0) {
      return;
    }

    const results = await Promise.allSettled(
      telemetries.map((telemetry) => this.insert(telemetry)),
    );

    const failure = results.find((result) => result.status === "rejected");
    if (failure) {
      this.markFailed(failure.reason);
      return;
    }

    this.markRecovered();
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

  private async insert(telemetry: RobotTelemetry): Promise<void> {
    const state = telemetry.state;

    await this.telemetryRepository.insert({
      vendors_connections_devices_id: telemetry.deviceId,
      seq: state.seq,
      source_ts: state.sourceTs,
      received_ts: state.receivedTs,
      x: state.x,
      y: state.y,
      theta: state.theta,
      speed: state.speed,
      battery_pct: state.batteryPct,
      op_state: state.opState,
      error_code: state.errorCode,
      loaded: state.loaded,
    });
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
      this.logger.warn(`이력 기록 실패: ${String(error)}`);
    }

    this.failing = true;
  }

  private markRecovered(): void {
    if (this.failing) {
      this.logger.log("이력 기록 회복");
    }

    this.failing = false;
  }
}
