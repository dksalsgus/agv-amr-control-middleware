import { Inject, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { judgeSeq } from "../common/utils/seq-judge.util";
import { ingestConfig } from "../config/ingest.config";
import { toErrorMessage } from "../common/utils/error.util";
import { PlcPointValue } from "../state/plc-point-state";
import { PlcAdapter } from "./adapters/plc.adapter";
import { PlcReading } from "./adapters/plc.types";
import { IngestConnectionProvider } from "./providers/ingest-connection.provider";
import { IngestConnection, PlcDevice } from "./providers/connection.types";
import { DeviceTransportProvider } from "./providers/device-transport.provider";
import {
  ModbusConnectionConfig,
  ModbusRawMessage,
} from "./providers/device-transport.types";
import { HistoryQueueProvider } from "./providers/history-queue.provider";
import { IngestMetricsProvider } from "./providers/ingest-metrics.provider";
import { PlcEventProvider } from "./providers/plc-event.provider";
import { PlcPointChange } from "./providers/plc-event.types";
import { LinkQualityProvider } from "./providers/link-quality.provider";
import { LinkStateProvider } from "./providers/link-state.provider";
import { PollScheduleProvider } from "./providers/poll-schedule.provider";
import { PlcPointStateProvider } from "./providers/plc-point-state.provider";
import { AppLogger } from "../logger/app-logger";

/** PLC 수집: 16점 폴링 → seq 판정 → 값이 바뀐 점만 반영·기록. 500ms보다 짧은 펄스는 놓친다. */
@Injectable()
export class PlcIngestService implements OnApplicationBootstrap {
  private readonly connections = new Map<string, IngestConnection>();

  constructor(
    @Inject(ingestConfig.KEY)
    private readonly config: ConfigType<typeof ingestConfig>,
    private readonly ingestConnectionProvider: IngestConnectionProvider,
    private readonly deviceTransportProvider: DeviceTransportProvider,
    private readonly plcAdapter: PlcAdapter,
    private readonly plcPointStateProvider: PlcPointStateProvider,
    private readonly plcEventProvider: PlcEventProvider,
    private readonly historyQueueProvider: HistoryQueueProvider,
    private readonly ingestMetricsProvider: IngestMetricsProvider,
    private readonly linkStateProvider: LinkStateProvider,
    private readonly linkQualityProvider: LinkQualityProvider,
    private readonly pollScheduleProvider: PollScheduleProvider,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(PlcIngestService.name);
  }

  /** 시작할 때 켜진 PLC 연결을 모두 불러와 등록하고, 이력으로 값을 되살린 뒤 폴링을 시작한다. */
  async onApplicationBootstrap(): Promise<void> {
    const connections = await this.loadConnections();
    for (const connection of connections) {
      await this.register(connection);
    }

    await this.restoreLatestValues();

    for (const connection of connections) {
      this.startPolling(connection.id);
    }
  }

  /**
   * 추가하거나 고친 연결 하나를 DB에서 다시 읽어 붙인다. 꺼졌으면 뗀다.
   * 폴링이라 접속을 닫아 두면 다음 폴링이 새 설정으로 다시 연다.
   * PLC가 없는 연결(로봇)은 다루지 않는다.
   */
  async reloadConnection(id: string): Promise<void> {
    const latest =
      await this.ingestConnectionProvider.findEnabledConnection(id);
    const next = latest && latest.plcDevices.length > 0 ? latest : null;
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
      this.startPolling(next.id);
      return;
    }

    await this.deviceTransportProvider.close(current);
    this.connections.set(next.id, next);
    await this.linkStateProvider.register(next.id);
    this.logger.log(`연결 다시 붙임: ${next.vendorCode} ${next.protocol}`);
  }

  /** 지운 연결을 뗀다. 맡은 연결이 아니면 아무것도 하지 않는다. */
  async removeConnection(id: string): Promise<void> {
    const current = this.connections.get(id);
    if (current) {
      await this.close(current);
    }
  }

  /** 한 번 폴링하고 다음 폴링까지 기다릴 ms를 돌려준다. 연결이 없으면 null. */
  async poll(connectionId: string): Promise<number | null> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return null;
    }

    const config = connection.config as ModbusConnectionConfig;
    const startedAt = Date.now();
    await this.pollOnce(connection);

    const retryDelayMs = await this.linkStateProvider.findRetryDelayMs(
      connection.id,
    );
    if (retryDelayMs !== null) {
      return retryDelayMs;
    }

    const elapsedMs = Date.now() - startedAt;
    return Math.max(0, config.pollIntervalMs - elapsedMs);
  }

  private async loadConnections(): Promise<IngestConnection[]> {
    const connections =
      await this.ingestConnectionProvider.findEnabledConnections();
    return connections.filter((connection) => connection.plcDevices.length > 0);
  }

  private async register(connection: IngestConnection): Promise<void> {
    this.connections.set(connection.id, connection);
    await this.linkStateProvider.register(connection.id);

    for (const device of connection.plcDevices) {
      await this.plcPointStateProvider.registerPoints(device.points);
    }
  }

  private startPolling(connectionId: string): void {
    this.pollScheduleProvider.add(connectionId, (id) => this.poll(id));
  }

  private async close(connection: IngestConnection): Promise<void> {
    this.connections.delete(connection.id);
    this.pollScheduleProvider.remove(connection.id);
    await this.deviceTransportProvider.close(connection);
    await this.linkStateProvider.unregister(connection.id);

    for (const device of connection.plcDevices) {
      await this.plcPointStateProvider.unregisterPoints(
        device.deviceId,
        device.points,
      );
    }
  }

  /** 점 값만 되살린다. 이벤트는 값이 바뀔 때만 쌓여 seq 기준으로는 쓸 수 없다. */
  private async restoreLatestValues(): Promise<void> {
    const latestValues = await this.plcEventProvider.findLatestValues();

    for (const latest of latestValues) {
      await this.plcPointStateProvider.apply(latest.pointId, latest.current);
    }

    this.logger.log(`PLC 점 ${latestValues.length}개 복구`);
  }

  private async pollOnce(connection: IngestConnection): Promise<void> {
    const label = `${connection.vendorCode} ${connection.protocol}`;
    const raw = await this.tryPollPlc(connection, label);
    await this.linkQualityProvider.recordPoll(connection.id, raw !== null);
    if (!raw) {
      return;
    }

    await this.linkStateProvider.markUp(connection.id, label);

    try {
      const reading = await this.plcAdapter.toCommon(raw);
      await this.applyReading(connection, reading);
    } catch (error) {
      this.logger.warn(`PLC 변환 실패 (${connection.id}): ${String(error)}`);
    }
  }

  /** 실패하면 연결 실패로 세고 null을 돌려준다. */
  private async tryPollPlc(
    connection: IngestConnection,
    label: string,
  ): Promise<ModbusRawMessage | null> {
    try {
      return await this.deviceTransportProvider.pollPlc(connection);
    } catch (error) {
      await this.linkStateProvider.markFailure(
        connection.id,
        label,
        toErrorMessage(error),
      );
      return null;
    }
  }

  private async applyReading(
    connection: IngestConnection,
    reading: PlcReading,
  ): Promise<void> {
    const device = connection.plcDevices.find(
      (item) => item.externalId === reading.externalId,
    );
    if (!device) {
      return;
    }

    const last = await this.plcPointStateProvider.findLastRead(device.deviceId);
    const judgement = judgeSeq(last, reading, this.config.restartThresholdMs);
    const receivedTs = new Date();
    await this.ingestMetricsProvider.record(
      `${connection.vendorCode} ${connection.protocol}`,
      judgement,
      reading.sourceTs,
      receivedTs,
    );
    if (!judgement.accept) {
      return;
    }

    await this.plcPointStateProvider.updateLastRead(device.deviceId, {
      seq: reading.seq,
      sourceTs: reading.sourceTs,
      receivedTs,
    });

    const changes = await this.applyChangedPoints(device, reading, receivedTs);
    await this.historyQueueProvider.addPlcEvents(changes);
  }

  private async applyChangedPoints(
    device: PlcDevice,
    reading: PlcReading,
    receivedTs: Date,
  ): Promise<PlcPointChange[]> {
    const changes: PlcPointChange[] = [];

    for (const point of device.points) {
      const value = reading.values[point.pointNo];
      const entry = await this.plcPointStateProvider.findById(point.pointId);
      if (entry?.current?.value === value) {
        continue;
      }

      const current: PlcPointValue = {
        value,
        seq: reading.seq,
        sourceTs: reading.sourceTs,
        receivedTs,
      };
      await this.plcPointStateProvider.apply(point.pointId, current);
      changes.push({ pointId: point.pointId, current });
    }

    return changes;
  }
}
