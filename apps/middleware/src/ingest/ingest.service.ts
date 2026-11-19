import { Inject, Injectable, Logger } from "@nestjs/common";
import { RobotState } from "../state/robot-state";
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
import {
  RestConnectionConfig,
  RestLinkProvider,
} from "./providers/rest-link.provider";
import { RobotStateProvider } from "./providers/robot-state.provider";
import { SeqJudgeProvider } from "./providers/seq-judge.provider";
import {
  RobotTelemetry,
  TelemetryProvider,
} from "./providers/telemetry.provider";
import { LinkStateProvider } from "./providers/link-state.provider";
import { SerialQueue } from "./serial-queue";

type PolledConfig = { pollIntervalMs: number };

/** 로봇 수집: 수신 → 공통 모델 변환 → seq 판정 → 메모리 반영 → 이력 기록 */
@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);
  private connections: IngestConnection[] = [];
  private readonly queues = new Map<string, SerialQueue>();

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
    private readonly linkStateProvider: LinkStateProvider,
  ) {}

  async start(): Promise<void> {
    const connections = await this.connectionProvider.findEnabledConnections();
    this.connections = connections.filter(
      (connection) => connection.robots.length > 0,
    );

    for (const connection of this.connections) {
      await this.robotStateProvider.registerDevices(connection.robots);
      await this.linkStateProvider.register(connection.id);
    }

    await this.restoreLatestStates();

    for (const connection of this.connections) {
      await this.startPushConnection(connection);
    }
  }

  /** 폴링 연결(REST, Modbus)의 id 목록 */
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

    const retryDelayMs = await this.linkStateProvider.findRetryDelayMs(
      connection.id,
    );
    if (retryDelayMs !== null) {
      return retryDelayMs;
    }

    const config = connection.config as PolledConfig;
    const elapsedMs = Date.now() - startedAt;
    return Math.max(0, config.pollIntervalMs - elapsedMs);
  }

  /** 장비별 마지막 이력 행으로 메모리 상태를 되살린다. */
  private async restoreLatestStates(): Promise<void> {
    const latestStates = await this.telemetryProvider.findLatestStates();

    for (const latest of latestStates) {
      await this.robotStateProvider.apply(latest.deviceId, latest.state);
    }

    this.logger.log(`로봇 상태 ${latestStates.length}대 복구`);
  }

  /** MQTT 연결은 시작할 때 수신 핸들러를 등록한다. */
  private async startPushConnection(
    connection: IngestConnection,
  ): Promise<void> {
    if (connection.protocol !== "MQTT") {
      return;
    }

    const adapter = await this.findAdapter(connection.vendorCode);
    if (!adapter) {
      this.logger.warn(`어댑터 없음: ${connection.vendorCode}`);
      return;
    }

    const label = await this.toLabel(connection);
    await this.mqttLinkProvider.start(
      connection.id,
      connection.config as MqttConnectionConfig,
      {
        onMessage: async (raw) => {
          await this.handleRaw(connection.id, adapter, raw);
        },
        onLinkChange: async (up) => {
          if (up) {
            await this.linkStateProvider.markUp(connection.id, label);
            return;
          }

          await this.linkStateProvider.markDown(
            connection.id,
            label,
            "브로커 연결 종료",
          );
        },
      },
    );
  }

  private async pollOnce(connection: IngestConnection): Promise<void> {
    const adapter = await this.findAdapter(connection.vendorCode);
    if (!adapter) {
      return;
    }

    const label = await this.toLabel(connection);
    const raws = await this.tryFetchRaws(connection, label);
    if (!raws) {
      return;
    }

    await this.linkStateProvider.markUp(connection.id, label);
    for (const raw of raws) {
      await this.handleRaw(connection.id, adapter, raw);
    }
  }

  /** 실패하면 연결 실패로 세고 null을 돌려준다. */
  private async tryFetchRaws(
    connection: IngestConnection,
    label: string,
  ): Promise<unknown[] | null> {
    try {
      return await this.fetchRaws(connection);
    } catch (error) {
      await this.linkStateProvider.markFailure(
        connection.id,
        label,
        String(error),
      );
      return null;
    }
  }

  private async fetchRaws(connection: IngestConnection): Promise<unknown[]> {
    const externalIds = connection.robots.map((robot) => robot.externalId);

    if (connection.protocol === "REST") {
      const config = connection.config as RestConnectionConfig;
      return await this.restLinkProvider.poll(config, externalIds);
    }

    const config = connection.config as ModbusConnectionConfig;
    const blockNumbers = externalIds.map((externalId) => Number(externalId));
    return await this.modbusLinkProvider.poll(
      connection.id,
      config,
      blockNumbers,
    );
  }

  /** 메모리 반영을 먼저 끝내고 이력 기록을 기다린다. DB가 느려도 조회는 최신 상태를 본다. */
  private async handleRaw(
    connectionId: string,
    adapter: VendorAdapter<unknown>,
    raw: unknown,
  ): Promise<void> {
    const readings = await this.toReadings(adapter, raw);
    const receivedTs = new Date();

    const queue = await this.findQueue(connectionId);
    const accepted = await queue.run(() =>
      this.applyReadings(connectionId, readings, receivedTs),
    );

    await this.telemetryProvider.recordAll(accepted);
  }

  private async applyReadings(
    connectionId: string,
    readings: RobotReading[],
    receivedTs: Date,
  ): Promise<RobotTelemetry[]> {
    const accepted: RobotTelemetry[] = [];

    for (const reading of readings) {
      const telemetry = await this.applyReading(
        connectionId,
        reading,
        receivedTs,
      );
      if (telemetry) {
        accepted.push(telemetry);
      }
    }

    return accepted;
  }

  private async toReadings(
    adapter: VendorAdapter<unknown>,
    raw: unknown,
  ): Promise<RobotReading[]> {
    try {
      return await adapter.toCommon(raw);
    } catch (error) {
      this.logger.warn(`변환 실패 (${adapter.vendorCode}): ${String(error)}`);
      return [];
    }
  }

  /** seq 판정을 통과하면 메모리에 반영하고 기록할 이력을 돌려준다. */
  private async applyReading(
    connectionId: string,
    reading: RobotReading,
    receivedTs: Date,
  ): Promise<RobotTelemetry | null> {
    const entry = await this.robotStateProvider.findByExternalId(
      connectionId,
      reading.externalId,
    );
    if (!entry) {
      return null;
    }

    const judgement = await this.seqJudgeProvider.judge(entry.state, reading);
    if (!judgement.accept) {
      return null;
    }

    const state = await this.toState(reading, receivedTs);
    await this.robotStateProvider.apply(entry.deviceId, state);
    return { deviceId: entry.deviceId, state };
  }

  private async toState(
    reading: RobotReading,
    receivedTs: Date,
  ): Promise<RobotState> {
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

  private async toLabel(connection: IngestConnection): Promise<string> {
    return `${connection.vendorCode} ${connection.protocol}`;
  }

  private async findAdapter(
    vendorCode: string,
  ): Promise<VendorAdapter<unknown> | undefined> {
    return this.adapters.find((adapter) => adapter.vendorCode === vendorCode);
  }

  private async findQueue(connectionId: string): Promise<SerialQueue> {
    const existing = this.queues.get(connectionId);
    if (existing) {
      return existing;
    }

    const queue = new SerialQueue();
    this.queues.set(connectionId, queue);
    return queue;
  }
}
