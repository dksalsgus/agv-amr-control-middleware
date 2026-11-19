import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  RobotReading,
  VENDOR_ADAPTERS,
  VendorAdapter,
} from "./adapters/vendor-adapter";
import {
  ConnectionProvider,
  IngestConnection,
} from "./providers/connection.provider";
import {
  ModbusConnectionConfig,
  ModbusLinkProvider,
} from "./providers/modbus-link.provider";
import {
  MqttConnectionConfig,
  MqttLinkProvider,
} from "./providers/mqtt-link.provider";
import { RobotState } from "../state/robot-state";
import {
  RestConnectionConfig,
  RestLinkProvider,
} from "./providers/rest-link.provider";
import { RobotStateProvider } from "./providers/robot-state.provider";
import { SeqJudgeProvider } from "./providers/seq-judge.provider";
import { TelemetryProvider } from "./providers/telemetry.provider";
import { PollTracker } from "./poll-tracker";

/**
 * 수집: 원본 수신 → 어댑터로 공통 모델 변환 → seq 판정 → 메모리 상태 반영 → 이력 기록.
 * 시작과 폴링 시점은 Controller 위치의 IngestScheduler가 정한다.
 */
@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);
  private connections: IngestConnection[] = [];
  private readonly pollTracker = new PollTracker();

  constructor(
    @Inject(VENDOR_ADAPTERS)
    private readonly adapters: VendorAdapter<unknown>[],
    private readonly connectionProvider: ConnectionProvider,
    private readonly mqttLinkProvider: MqttLinkProvider,
    private readonly restLinkProvider: RestLinkProvider,
    private readonly modbusLinkProvider: ModbusLinkProvider,
    private readonly robotStateProvider: RobotStateProvider,
    private readonly seqJudgeProvider: SeqJudgeProvider,
    private readonly telemetryProvider: TelemetryProvider,
  ) {}

  async start() {
    this.connections = await this.connectionProvider.findEnabledConnections();

    for (const connection of this.connections) {
      this.robotStateProvider.registerDevices(connection.robots);
    }

    await this.restoreLatestStates();

    for (const connection of this.connections) {
      this.startConnection(connection);
    }
  }

  /** 주기가 된 폴링 연결(REST, Modbus)을 한 번씩 폴링한다. 이전 요청이 아직 끝나지 않았으면 건너뛴다. */
  pollDue(now: number) {
    for (const connection of this.connections) {
      if (connection.protocol === "MQTT") {
        continue;
      }

      const config = connection.config as { pollIntervalMs: number };
      if (!this.pollTracker.isDue(connection.id, config.pollIntervalMs, now)) {
        continue;
      }

      void this.poll(connection, now);
    }
  }

  /** 재시작 때 이력의 장비별 마지막 행으로 메모리 상태를 되살린다(설계 문서 5장). */
  private async restoreLatestStates() {
    const latestStates = await this.telemetryProvider.findLatestStates();

    for (const latest of latestStates) {
      this.robotStateProvider.apply(latest.deviceId, latest.state);
    }

    this.logger.log(`로봇 상태 ${latestStates.length}대 복구`);
  }

  private startConnection(connection: IngestConnection) {
    const adapter = this.findAdapter(connection.vendorCode);
    if (!adapter) {
      this.logger.warn(`어댑터 없음: ${connection.vendorCode}`);
      return;
    }

    if (connection.protocol === "MQTT") {
      this.mqttLinkProvider.start(
        connection.id,
        connection.config as MqttConnectionConfig,
        (raw) => this.handleRaw(connection.id, adapter, raw),
      );
    }
  }

  private async poll(connection: IngestConnection, now: number) {
    const adapter = this.findAdapter(connection.vendorCode);
    if (!adapter) {
      return;
    }

    this.pollTracker.begin(connection.id, now);

    try {
      const raws = await this.fetchRaws(connection);

      for (const raw of raws) {
        this.handleRaw(connection.id, adapter, raw);
      }
    } catch (error) {
      this.logger.warn(`폴링 실패 (${connection.id}): ${String(error)}`);
    } finally {
      this.pollTracker.end(connection.id, now);
    }
  }

  private fetchRaws(connection: IngestConnection): Promise<unknown[]> {
    const externalIds = connection.robots.map((robot) => robot.externalId);

    if (connection.protocol === "REST") {
      const config = connection.config as RestConnectionConfig;
      return this.restLinkProvider.poll(config, externalIds);
    }

    const config = connection.config as ModbusConnectionConfig;
    const blockNumbers = externalIds.map((externalId) => Number(externalId));
    return this.modbusLinkProvider.poll(connection.id, config, blockNumbers);
  }

  private handleRaw(
    connectionId: string,
    adapter: VendorAdapter<unknown>,
    raw: unknown,
  ) {
    let readings: RobotReading[];
    try {
      readings = adapter.toCommon(raw);
    } catch (error) {
      this.logger.warn(`변환 실패 (${adapter.vendorCode}): ${String(error)}`);
      return;
    }

    const receivedTs = new Date();
    for (const reading of readings) {
      this.applyReading(connectionId, reading, receivedTs);
    }
  }

  private applyReading(
    connectionId: string,
    reading: RobotReading,
    receivedTs: Date,
  ) {
    const entry = this.robotStateProvider.findByExternalId(
      connectionId,
      reading.externalId,
    );
    if (!entry) {
      return;
    }

    const judgement = this.seqJudgeProvider.judge(entry.state, reading);
    if (!judgement.accept) {
      return;
    }

    const state = this.toState(reading, receivedTs);
    this.robotStateProvider.apply(entry.deviceId, state);
    this.telemetryProvider.record(entry.deviceId, state);
  }

  private toState(reading: RobotReading, receivedTs: Date): RobotState {
    return {
      seq: reading.seq,
      sourceTs: reading.sourceTs,
      receivedTs,
      x: reading.x,
      y: reading.y,
      theta: reading.theta,
      speed: reading.speed,
      batteryPct: reading.batteryPct,
      opState: reading.opState,
      errorCode: reading.errorCode,
      loaded: reading.loaded,
    };
  }

  private findAdapter(vendorCode: string): VendorAdapter<unknown> | undefined {
    return this.adapters.find((adapter) => adapter.vendorCode === vendorCode);
  }
}
