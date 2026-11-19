import { Injectable, Logger } from "@nestjs/common";
import { PlcAdapter, PlcReading } from "./adapters/plc.adapter";
import {
  ConnectionProvider,
  IngestConnection,
  PlcDevice,
} from "./providers/connection.provider";
import {
  ModbusConnectionConfig,
  ModbusLinkProvider,
} from "./providers/modbus-link.provider";
import { PlcEventProvider } from "./providers/plc-event.provider";
import { PlcPointStateProvider } from "./providers/plc-point-state.provider";
import { SeqJudgeProvider } from "./providers/seq-judge.provider";

/**
 * PLC 수집: 16점을 한 번에 폴링 → seq 판정 → 값이 바뀐 점만 메모리 반영과 이벤트 기록.
 * 폴링이라 주기(500ms)보다 짧은 펄스는 잡지 못한다(설계 문서 6장).
 */
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
  ) {}

  async start() {
    const connections = await this.connectionProvider.findEnabledConnections();
    this.connections = connections.filter(
      (connection) => connection.plcDevices.length > 0,
    );

    for (const connection of this.connections) {
      for (const device of connection.plcDevices) {
        this.plcPointStateProvider.registerPoints(device.points);
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

    const elapsedMs = Date.now() - startedAt;
    return Math.max(0, config.pollIntervalMs - elapsedMs);
  }

  /** 점별 마지막 이벤트로 현재 값을 되살린다. seq 기준은 되살리지 않고 첫 수신부터 다시 잡는다. */
  private async restoreLatestValues() {
    const latestValues = await this.plcEventProvider.findLatestValues();

    for (const latest of latestValues) {
      this.plcPointStateProvider.apply(latest.pointId, latest.current);
    }

    this.logger.log(`PLC 점 ${latestValues.length}개 복구`);
  }

  private async pollOnce(
    connection: IngestConnection,
    config: ModbusConnectionConfig,
  ) {
    try {
      const raw = await this.modbusLinkProvider.pollInputBlock(
        connection.id,
        config,
      );
      const reading = this.plcAdapter.toCommon(raw);
      this.applyReading(connection, reading);
    } catch (error) {
      this.logger.warn(`PLC 폴링 실패 (${connection.id}): ${String(error)}`);
    }
  }

  private applyReading(connection: IngestConnection, reading: PlcReading) {
    const device = connection.plcDevices.find(
      (item) => item.externalId === reading.externalId,
    );
    if (!device) {
      return;
    }

    const last = this.plcPointStateProvider.findLastSeq(device.deviceId);
    const judgement = this.seqJudgeProvider.judge(last, reading);
    if (!judgement.accept) {
      return;
    }

    this.plcPointStateProvider.updateLastSeq(device.deviceId, {
      seq: reading.seq,
      sourceTs: reading.sourceTs,
    });
    this.applyChangedPoints(device, reading, new Date());
  }

  private applyChangedPoints(
    device: PlcDevice,
    reading: PlcReading,
    receivedTs: Date,
  ) {
    for (const point of device.points) {
      const value = reading.values[point.pointNo];
      const entry = this.plcPointStateProvider.findById(point.pointId);
      if (entry?.current?.value === value) {
        continue;
      }

      const current = {
        value,
        seq: reading.seq,
        sourceTs: reading.sourceTs,
        receivedTs,
      };
      this.plcPointStateProvider.apply(point.pointId, current);
      this.plcEventProvider.record(point.pointId, current);
    }
  }
}
