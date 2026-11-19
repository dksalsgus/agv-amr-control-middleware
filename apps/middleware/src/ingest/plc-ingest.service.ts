import { Injectable, Logger } from "@nestjs/common";
import { PlcPointValue } from "../state/plc-point-state";
import { PlcAdapter } from "./adapters/plc.adapter";
import { PlcReading } from "./adapters/plc.types";
import { ConnectionProvider } from "./providers/connection.provider";
import { IngestConnection, PlcDevice } from "./providers/connection.types";
import { ModbusLinkProvider } from "./providers/modbus-link.provider";
import {
  ModbusConnectionConfig,
  ModbusRawMessage,
} from "./providers/modbus-link.types";
import { PlcEventProvider } from "./providers/plc-event.provider";
import { PlcPointChange } from "./providers/plc-event.types";
import { LinkStateProvider } from "./providers/link-state.provider";
import { PlcPointStateProvider } from "./providers/plc-point-state.provider";
import { SeqJudgeProvider } from "./providers/seq-judge.provider";

/** PLC 수집: 16점 폴링 → seq 판정 → 값이 바뀐 점만 반영·기록. 500ms보다 짧은 펄스는 놓친다. */
@Injectable()
export class PlcIngestService {
  private readonly logger = new Logger(PlcIngestService.name);
  private readonly connections = new Map<string, IngestConnection>();

  constructor(
    private readonly connectionProvider: ConnectionProvider,
    private readonly modbusLinkProvider: ModbusLinkProvider,
    private readonly plcAdapter: PlcAdapter,
    private readonly seqJudgeProvider: SeqJudgeProvider,
    private readonly plcPointStateProvider: PlcPointStateProvider,
    private readonly plcEventProvider: PlcEventProvider,
    private readonly linkStateProvider: LinkStateProvider,
  ) {}

  async start(): Promise<void> {
    for (const connection of await this.loadConnections()) {
      await this.register(connection);
    }

    await this.restoreLatestValues();
  }

  /** DB 설정과 맞춘다. 폴링이라 다시 붙는 것은 다음 폴링이 새 설정을 읽는 것으로 충분하다. */
  async sync(): Promise<void> {
    const latest = await this.loadConnections();
    const latestIds = new Set(latest.map((connection) => connection.id));

    for (const current of Array.from(this.connections.values())) {
      if (!latestIds.has(current.id)) {
        await this.close(current);
      }
    }

    for (const connection of latest) {
      const current = this.connections.get(connection.id);
      if (!current) {
        await this.register(connection);
      } else if (current.version !== connection.version) {
        await this.modbusLinkProvider.disconnect(current.id);
        this.connections.set(connection.id, connection);
        await this.linkStateProvider.register(connection.id);
      }
    }
  }

  async findPolledConnectionIds(): Promise<string[]> {
    return Array.from(this.connections.keys());
  }

  /** 한 번 폴링하고 다음 폴링까지 기다릴 ms를 돌려준다. 연결이 없으면 null. */
  async poll(connectionId: string): Promise<number | null> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return null;
    }

    const config = connection.config as ModbusConnectionConfig;
    const startedAt = Date.now();
    await this.pollOnce(connection, config);

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
    const connections = await this.connectionProvider.findEnabledConnections();
    return connections.filter((connection) => connection.plcDevices.length > 0);
  }

  private async register(connection: IngestConnection): Promise<void> {
    this.connections.set(connection.id, connection);
    await this.linkStateProvider.register(connection.id);

    for (const device of connection.plcDevices) {
      await this.plcPointStateProvider.registerPoints(device.points);
    }
  }

  private async close(connection: IngestConnection): Promise<void> {
    this.connections.delete(connection.id);
    await this.modbusLinkProvider.disconnect(connection.id);
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

  private async pollOnce(
    connection: IngestConnection,
    config: ModbusConnectionConfig,
  ): Promise<void> {
    const label = `${connection.vendorCode} ${connection.protocol}`;
    const raw = await this.tryPollInputBlock(connection, config, label);
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
  private async tryPollInputBlock(
    connection: IngestConnection,
    config: ModbusConnectionConfig,
    label: string,
  ): Promise<ModbusRawMessage | null> {
    try {
      return await this.modbusLinkProvider.pollInputBlock(
        connection.id,
        config,
      );
    } catch (error) {
      await this.linkStateProvider.markFailure(
        connection.id,
        label,
        String(error),
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
    const judgement = await this.seqJudgeProvider.judge(last, reading);
    if (!judgement.accept) {
      return;
    }

    const receivedTs = new Date();
    await this.plcPointStateProvider.updateLastRead(device.deviceId, {
      seq: reading.seq,
      sourceTs: reading.sourceTs,
      receivedTs,
    });

    const changes = await this.applyChangedPoints(device, reading, receivedTs);
    await this.plcEventProvider.recordAll(changes);
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
