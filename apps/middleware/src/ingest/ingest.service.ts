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

/**
 * 로봇 수집: 원본 수신 → 어댑터로 공통 모델 변환 → seq 판정 → 메모리 상태 반영 → 이력 기록.
 * 시작과 폴링 시점은 Controller 위치의 IngestScheduler가 정한다.
 */
@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);
  private connections: IngestConnection[] = [];

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
    const connections = await this.connectionProvider.findEnabledConnections();
    this.connections = connections.filter(
      (connection) => connection.robots.length > 0,
    );

    for (const connection of this.connections) {
      this.robotStateProvider.registerDevices(connection.robots);
    }

    await this.restoreLatestStates();

    for (const connection of this.connections) {
      this.startConnection(connection);
    }
  }

  /** 폴링 방식(REST, Modbus) 연결 id 목록 */
  async findPolledConnectionIds(): Promise<string[]> {
    return this.connections
      .filter((connection) => connection.protocol !== "MQTT")
      .map((connection) => connection.id);
  }

  /** 한 번 폴링하고 다음 폴링까지 기다릴 ms를 돌려준다. 연결이 없으면 null. */
  async poll(connectionId: string): Promise<number | null> {
    const connection = this.connections.find(
      (item) => item.id === connectionId,
    );
    if (!connection) {
      return null;
    }

    const startedAt = Date.now();
    await this.pollOnce(connection);

    const config = connection.config as { pollIntervalMs: number };
    const elapsedMs = Date.now() - startedAt;
    return Math.max(0, config.pollIntervalMs - elapsedMs);
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

  private async pollOnce(connection: IngestConnection) {
    const adapter = this.findAdapter(connection.vendorCode);
    if (!adapter) {
      return;
    }

    try {
      const raws = await this.fetchRaws(connection);

      for (const raw of raws) {
        this.handleRaw(connection.id, adapter, raw);
      }
    } catch (error) {
      this.logger.warn(`폴링 실패 (${connection.id}): ${String(error)}`);
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
    const readings = this.toReadings(adapter, raw);
    if (!readings) {
      return;
    }

    const receivedTs = new Date();
    for (const reading of readings) {
      this.applyReading(connectionId, reading, receivedTs);
    }
  }

  private toReadings(
    adapter: VendorAdapter<unknown>,
    raw: unknown,
  ): RobotReading[] | null {
    try {
      return adapter.toCommon(raw);
    } catch (error) {
      this.logger.warn(`변환 실패 (${adapter.vendorCode}): ${String(error)}`);
      return null;
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
