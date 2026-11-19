import { Inject, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { toErrorMessage } from "../common/utils/error.util";
import { ConfigType } from "@nestjs/config";
import { ingestConfig } from "../config/ingest.config";
import { judgeSeq } from "../common/utils/seq-judge.util";
import { RobotState } from "../state/robot-state";
import {
  RobotReading,
  VENDOR_ADAPTERS,
  VendorAdapter,
} from "./adapters/vendor-adapter";
import { IngestConnectionProvider } from "./providers/ingest-connection.provider";
import { DeviceTransportProvider } from "./providers/device-transport.provider";
import { IngestConnection } from "./providers/connection.types";
import { RobotStateProvider } from "./providers/robot-state.provider";
import { HistoryQueueProvider } from "./providers/history-queue.provider";
import { IngestMetricsProvider } from "./providers/ingest-metrics.provider";
import { TelemetryProvider } from "./providers/telemetry.provider";
import { RobotTelemetry } from "./providers/telemetry.types";
import { LinkQualityProvider } from "./providers/link-quality.provider";
import { LinkStateProvider } from "./providers/link-state.provider";
import { PollScheduleProvider } from "./providers/poll-schedule.provider";
import { SerialQueue } from "./serial-queue";
import { PolledConfig } from "./ingest.types";
import { AppLogger } from "../logger/app-logger";

/** 로봇 수집: 수신 → 공통 모델 변환 → seq 판정 → 메모리 반영 → 이력 기록 */
@Injectable()
export class IngestService implements OnApplicationBootstrap {
  private readonly connections = new Map<string, IngestConnection>();
  private readonly queues = new Map<string, SerialQueue>();

  constructor(
    @Inject(ingestConfig.KEY)
    private readonly config: ConfigType<typeof ingestConfig>,
    @Inject(VENDOR_ADAPTERS)
    private readonly adapters: VendorAdapter<unknown>[],
    private readonly ingestConnectionProvider: IngestConnectionProvider,
    private readonly deviceTransportProvider: DeviceTransportProvider,
    private readonly robotStateProvider: RobotStateProvider,
    private readonly telemetryProvider: TelemetryProvider,
    private readonly historyQueueProvider: HistoryQueueProvider,
    private readonly ingestMetricsProvider: IngestMetricsProvider,
    private readonly linkStateProvider: LinkStateProvider,
    private readonly linkQualityProvider: LinkQualityProvider,
    private readonly pollScheduleProvider: PollScheduleProvider,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(IngestService.name);
  }

  /** 시작할 때 켜진 연결을 모두 불러와 장비를 등록하고, 이력으로 상태를 되살린 뒤 수신을 시작한다. */
  async onApplicationBootstrap(): Promise<void> {
    const connections = await this.loadConnections();

    for (const connection of connections) {
      await this.register(connection);
    }

    await this.restoreLatestStates();

    for (const connection of connections) {
      await this.startReceiving(connection);
    }
  }

  /**
   * 추가하거나 고친 연결 하나를 DB에서 다시 읽어 붙인다. 꺼졌으면 뗀다.
   * 로봇이 없는 연결(PLC)은 다루지 않는다.
   */
  async reloadConnection(id: string): Promise<void> {
    const latest =
      await this.ingestConnectionProvider.findEnabledConnection(id);
    const next = latest && latest.robots.length > 0 ? latest : null;
    const current = this.connections.get(id);

    if (current && !next) {
      await this.close(current);
      return;
    }
    if (!next) {
      return;
    }
    if (!current) {
      await this.register(next);
      await this.startReceiving(next);
      return;
    }
    await this.restart(current, next);
  }

  /** 다음 폴링 시각이 된 연결(로봇, PLC)만 폴링한다. 차례는 각 수집 Service가 연결을 붙일 때 넣는다. */
  runDuePolls(now: number): void {
    this.pollScheduleProvider.runDue(now);
  }

  /** 지운 연결을 뗀다. 맡은 연결이 아니면 아무것도 하지 않는다. */
  async removeConnection(id: string): Promise<void> {
    const current = this.connections.get(id);
    if (current) {
      await this.close(current);
    }
  }

  /** 기준 시간 넘게 메시지가 없는 MQTT 연결을 DOWN으로 바꾼다. 다시 받으면 UP으로 돌아온다. */
  async checkPushSilence(): Promise<void> {
    const silentIds = await this.linkStateProvider.findSilentConnectionIds(
      new Date(),
    );

    for (const connectionId of silentIds) {
      const connection = this.connections.get(connectionId);
      if (connection) {
        await this.linkStateProvider.markSilent(
          connectionId,
          this.toLabel(connection),
        );
      }
    }
  }

  /** 한 번 폴링하고 다음 폴링까지 기다릴 ms를 돌려준다. 연결이 없거나 MQTT로 바뀌었으면 null. */
  async poll(connectionId: string): Promise<number | null> {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.protocol === "MQTT") {
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

  private async loadConnections(): Promise<IngestConnection[]> {
    const connections =
      await this.ingestConnectionProvider.findEnabledConnections();
    return connections.filter((connection) => connection.robots.length > 0);
  }

  private async register(connection: IngestConnection): Promise<void> {
    this.connections.set(connection.id, connection);
    await this.robotStateProvider.registerDevices(connection.robots);
    await this.linkStateProvider.register(connection.id);
  }

  private async close(connection: IngestConnection): Promise<void> {
    this.connections.delete(connection.id);
    this.queues.delete(connection.id);
    this.pollScheduleProvider.remove(connection.id);
    await this.stopLink(connection);
    await this.robotStateProvider.unregisterDevices(connection.robots);
    await this.linkStateProvider.unregister(connection.id);
    this.logger.log(`연결 내림: ${this.toLabel(connection)}`);
  }

  /** 장비 상태는 두고 접속만 새 설정으로 바꾼다. 폴링 루프는 다음 차례에 새 설정을 읽는다. */
  private async restart(
    current: IngestConnection,
    next: IngestConnection,
  ): Promise<void> {
    await this.stopLink(current);
    this.connections.set(next.id, next);
    await this.linkStateProvider.register(next.id);
    await this.startReceiving(next);
    this.logger.log(`연결 다시 붙임: ${this.toLabel(next)}`);
  }

  /** MQTT는 구독하고, 폴링 연결은 폴링 차례에 넣는다. 프로토콜이 바뀌면 다른 쪽은 뺀다. */
  private async startReceiving(connection: IngestConnection): Promise<void> {
    if (connection.protocol === "MQTT") {
      this.pollScheduleProvider.remove(connection.id);
      await this.startPushConnection(connection);
      return;
    }

    this.pollScheduleProvider.add(connection.id, (connectionId) =>
      this.poll(connectionId),
    );
  }

  private async stopLink(connection: IngestConnection): Promise<void> {
    await this.deviceTransportProvider.close(connection);
  }

  /** 장비별 마지막 이력 행으로 메모리 상태를 되살린다. */
  private async restoreLatestStates(): Promise<void> {
    const latestStates = await this.telemetryProvider.findLatestStates();

    for (const latest of latestStates) {
      await this.robotStateProvider.apply(latest.deviceId, latest.state);
    }

    this.logger.log(`로봇 상태 ${latestStates.length}대 복구`);
  }

  private async startPushConnection(
    connection: IngestConnection,
  ): Promise<void> {
    if (connection.protocol !== "MQTT") {
      return;
    }

    const adapter = this.findAdapter(connection.vendorCode);
    if (!adapter) {
      this.logger.warn(`어댑터 없음: ${connection.vendorCode}`);
      return;
    }

    const label = this.toLabel(connection);
    await this.linkStateProvider.watchSilence(connection.id);
    await this.deviceTransportProvider.subscribe(connection, {
      onMessage: async (raw) => {
        await this.linkStateProvider.markReceived(connection.id, label);
        await this.handleRaw(
          connection.id,
          this.toLabel(connection),
          adapter,
          raw,
        );
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
    });
  }

  private async pollOnce(connection: IngestConnection): Promise<void> {
    const adapter = this.findAdapter(connection.vendorCode);
    if (!adapter) {
      return;
    }

    const label = this.toLabel(connection);
    const raws = await this.tryFetchRaws(connection, label);
    await this.linkQualityProvider.recordPoll(connection.id, raws !== null);
    if (!raws) {
      return;
    }

    await this.linkStateProvider.markUp(connection.id, label);
    for (const raw of raws) {
      await this.handleRaw(
        connection.id,
        this.toLabel(connection),
        adapter,
        raw,
      );
    }
  }

  /** 실패하면 연결 실패로 세고 null을 돌려준다. */
  private async tryFetchRaws(
    connection: IngestConnection,
    label: string,
  ): Promise<unknown[] | null> {
    try {
      return await this.deviceTransportProvider.pollRobots(connection);
    } catch (error) {
      await this.linkStateProvider.markFailure(
        connection.id,
        label,
        toErrorMessage(error),
      );
      return null;
    }
  }

  /** 메모리 반영을 먼저 끝내고 이력 기록을 기다린다. DB가 느려도 조회는 최신 상태를 본다. */
  private async handleRaw(
    connectionId: string,
    label: string,
    adapter: VendorAdapter<unknown>,
    raw: unknown,
  ): Promise<void> {
    const readings = await this.toReadings(adapter, raw);
    const receivedTs = new Date();

    const queue = this.findQueue(connectionId);
    const accepted = await queue.run(() =>
      this.applyReadings(connectionId, label, readings, receivedTs),
    );

    await this.historyQueueProvider.addTelemetry(accepted);
  }

  private async applyReadings(
    connectionId: string,
    label: string,
    readings: RobotReading[],
    receivedTs: Date,
  ): Promise<RobotTelemetry[]> {
    const accepted: RobotTelemetry[] = [];

    for (const reading of readings) {
      const telemetry = await this.applyReading(
        connectionId,
        label,
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
    label: string,
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

    const judgement = judgeSeq(
      entry.state,
      reading,
      this.config.restartThresholdMs,
    );
    await this.ingestMetricsProvider.record(
      label,
      judgement,
      reading.sourceTs,
      receivedTs,
    );
    const isPushConnection =
      this.connections.get(connectionId)?.protocol === "MQTT";
    if (isPushConnection) {
      await this.linkQualityProvider.recordPush(
        connectionId,
        judgement.missed,
        entry.state?.receivedTs ?? null,
      );
    }
    if (!judgement.accept) {
      return null;
    }

    const state = this.toState(reading, receivedTs);
    await this.robotStateProvider.apply(entry.deviceId, state);
    return { deviceId: entry.deviceId, state };
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

  private toLabel(connection: IngestConnection): string {
    return `${connection.vendorCode} ${connection.protocol}`;
  }

  private findAdapter(vendorCode: string): VendorAdapter<unknown> | undefined {
    return this.adapters.find((adapter) => adapter.vendorCode === vendorCode);
  }

  private findQueue(connectionId: string): SerialQueue {
    const existing = this.queues.get(connectionId);
    if (existing) {
      return existing;
    }

    const queue = new SerialQueue();
    this.queues.set(connectionId, queue);
    return queue;
  }
}
