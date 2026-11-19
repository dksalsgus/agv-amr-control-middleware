import { Injectable, Logger } from "@nestjs/common";
import { PlcPointValue } from "../state/plc-point-state";
import { PlcAdapter, PlcReading } from "./adapters/plc.adapter";
import {
  ConnectionProvider,
  IngestConnection,
  PlcDevice,
} from "./providers/connection.provider";
import {
  ModbusConnectionConfig,
  ModbusLinkProvider,
  ModbusRawMessage,
} from "./providers/modbus-link.provider";
import {
  PlcEventProvider,
  PlcPointChange,
} from "./providers/plc-event.provider";
import { LinkStateProvider } from "./providers/link-state.provider";
import { PlcPointStateProvider } from "./providers/plc-point-state.provider";
import { SeqJudgeProvider } from "./providers/seq-judge.provider";

/** PLC 수집: 16점 폴링 → seq 판정 → 값이 바뀐 점만 반영·기록. 500ms보다 짧은 펄스는 놓친다. */
@Injectable()
export class PlcIngestService {
  private readonly logger = new Logger(PlcIngestService.name);
  private connections: IngestConnection[] = [];

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
    const connections = await this.connectionProvider.findEnabledConnections();
    this.connections = connections.filter(
      (connection) => connection.plcDevices.length > 0,
    );

    for (const connection of this.connections) {
      await this.linkStateProvider.register(connection.id);
      for (const device of connection.plcDevices) {
        await this.plcPointStateProvider.registerPoints(device.points);
      }
    }

    await this.restoreLatestValues();
  }

  async findPolledConnectionIds(): Promise<string[]> {
    return this.connections.map((connection) => connection.id);
  }

  /** 한 번 폴링하고 다음 폴링까지 기다릴 ms를 돌려준다. 연결이 없으면 null. */
  async poll(connectionId: string): Promise<number | null> {
    const connection = this.connections.find(
      (item) => item.id === connectionId,
    );
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

    const last = await this.plcPointStateProvider.findLastSeq(device.deviceId);
    const judgement = await this.seqJudgeProvider.judge(last, reading);
    if (!judgement.accept) {
      return;
    }

    await this.plcPointStateProvider.updateLastSeq(device.deviceId, {
      seq: reading.seq,
      sourceTs: reading.sourceTs,
    });

    const changes = await this.applyChangedPoints(device, reading, new Date());
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
