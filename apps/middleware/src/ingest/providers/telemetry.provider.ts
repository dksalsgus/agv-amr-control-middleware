import { Injectable, Logger } from "@nestjs/common";
import {
  TelemetryRow,
  VendorsConnectionsDevicesTelemetryRepository,
} from "../../history/vendors-connections-devices-telemetry.repository";
import { RobotOpState, RobotState } from "../../state/robot-state";

export type LatestRobotState = {
  deviceId: string;
  state: RobotState;
};

/**
 * 로봇 이력 기록과 재시작 복구.
 * 기록은 완료를 기다리지 않는다: DB 장애가 실시간 전달을 멈추면 안 된다(설계 문서 6장 저장 흐름).
 */
@Injectable()
export class TelemetryProvider {
  private readonly logger = new Logger(TelemetryProvider.name);
  private failing = false;

  constructor(
    private readonly telemetryRepository: VendorsConnectionsDevicesTelemetryRepository,
  ) {}

  record(deviceId: string, state: RobotState) {
    this.telemetryRepository
      .insert({
        vendors_connections_devices_id: deviceId,
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
      })
      .then(() => this.markRecovered())
      .catch((error: unknown) => this.markFailed(error));
  }

  async findLatestStates(): Promise<LatestRobotState[]> {
    const rows = await this.telemetryRepository.findLatestPerDevice();

    return rows.map((row) => ({
      deviceId: row.vendors_connections_devices_id,
      state: this.toState(row),
    }));
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

  /** 실패가 시작될 때와 회복될 때만 로그를 남긴다. 초당 90건을 매번 찍지 않기 위해서다. */
  private markFailed(error: unknown) {
    if (!this.failing) {
      this.logger.warn(`이력 기록 실패: ${String(error)}`);
    }

    this.failing = true;
  }

  private markRecovered() {
    if (this.failing) {
      this.logger.log("이력 기록 회복");
    }

    this.failing = false;
  }
}
