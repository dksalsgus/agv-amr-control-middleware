import { InjectQueue } from "@nestjs/bullmq";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { Queue } from "bullmq";
import { queueConfig } from "../../config/queue.config";
import { AppLogger } from "../../logger/app-logger";
import { HISTORY_QUEUE } from "../history-queue.constants";
import {
  HistoryJobData,
  PlcEventJobRow,
  TelemetryJobRow,
} from "../history-queue.types";
import { PlcPointChange } from "./plc-event.types";
import { RobotTelemetry } from "./telemetry.types";

/**
 * 이력 저장 작업을 큐에 넣는다. DB가 멈춰도 작업은 Redis에 남아 다시 시도된다.
 * 넣기 실패는 밖으로 던지지 않는다(Redis 장애가 수집을 멈추면 안 됨).
 */
@Injectable()
export class HistoryQueueProvider {
  private failing = false;

  constructor(
    @Inject(queueConfig.KEY)
    private readonly config: ConfigType<typeof queueConfig>,
    @InjectQueue(HISTORY_QUEUE)
    private readonly queue: Queue<HistoryJobData>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(HistoryQueueProvider.name);
  }

  async addTelemetry(telemetries: RobotTelemetry[]): Promise<void> {
    if (telemetries.length === 0) {
      return;
    }

    await this.add({
      kind: "TELEMETRY",
      rows: telemetries.map((telemetry) => this.toTelemetryRow(telemetry)),
    });
  }

  async addPlcEvents(changes: PlcPointChange[]): Promise<void> {
    if (changes.length === 0) {
      return;
    }

    await this.add({
      kind: "PLC_EVENT",
      rows: changes.map((change) => this.toPlcEventRow(change)),
    });
  }

  /** 실패 시작과 회복 때만 로그를 남긴다. */
  private async add(data: HistoryJobData): Promise<void> {
    try {
      await this.queue.add(data.kind, data, {
        attempts: this.config.maxAttempts,
        backoff: { type: "fixed", delay: this.config.retryDelayMs },
        removeOnComplete: true,
        removeOnFail: this.config.keepFailedJobs,
      });
    } catch (error) {
      if (!this.failing) {
        this.logger.warn(`이력 큐 넣기 실패: ${String(error)}`);
      }
      this.failing = true;
      return;
    }

    if (this.failing) {
      this.logger.log("이력 큐 넣기 회복");
    }
    this.failing = false;
  }

  private toTelemetryRow(telemetry: RobotTelemetry): TelemetryJobRow {
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

  private toPlcEventRow(change: PlcPointChange): PlcEventJobRow {
    return {
      pointId: change.pointId,
      value: change.current.value,
      seq: change.current.seq,
      sourceTs: change.current.sourceTs.toISOString(),
      receivedTs: change.current.receivedTs.toISOString(),
    };
  }
}
