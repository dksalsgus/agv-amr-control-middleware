import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { ingestConfig } from "../../config/ingest.config";
import { ModbusClientRepository } from "../repositories/modbus-client.repository";
import { ModbusTarget } from "../repositories/modbus-client.types";
import { MqttClientRepository } from "../repositories/mqtt-client.repository";
import { MqttHandlers } from "../repositories/mqtt-client.types";
import { RestClientRepository } from "../repositories/rest-client.repository";
import { RestRawMessage } from "../repositories/rest-client.types";
import { IngestConnection } from "./connection.types";
import {
  ModbusConnectionConfig,
  ModbusRawMessage,
  MqttConnectionConfig,
  RestConnectionConfig,
} from "./device-transport.types";

/** 장비 접속. 프로토콜별 설정을 읽어 MQTT 구독, REST·Modbus 폴링, 접속 종료를 한다. */
@Injectable()
export class DeviceTransportProvider {
  /** Modbus 한 요청의 레지스터 수 상한 */
  private static readonly MAX_REGISTERS_PER_READ = 125;

  constructor(
    @Inject(ingestConfig.KEY)
    private readonly config: ConfigType<typeof ingestConfig>,
    private readonly mqttClientRepository: MqttClientRepository,
    private readonly restClientRepository: RestClientRepository,
    private readonly modbusClientRepository: ModbusClientRepository,
  ) {}

  async subscribe(
    connection: IngestConnection,
    handlers: MqttHandlers,
  ): Promise<void> {
    const config = connection.config as MqttConnectionConfig;

    await this.mqttClientRepository.subscribe(
      connection.id,
      {
        url: config.url,
        topic: config.topicPattern,
        qos: config.qos,
        username: config.username,
        password: config.password,
      },
      handlers,
    );
  }

  /** 로봇 연결(REST, Modbus)을 한 번 폴링해 raw 목록을 돌려준다. */
  async pollRobots(connection: IngestConnection): Promise<unknown[]> {
    const externalIds = connection.robots.map((robot) => robot.externalId);

    if (connection.protocol === "REST") {
      const config = connection.config as RestConnectionConfig;
      return await this.pollRest(config, externalIds);
    }

    const config = connection.config as ModbusConnectionConfig;
    const blockNumbers = externalIds.map((externalId) => Number(externalId));
    return await this.pollModbusBlocks(connection.id, config, blockNumbers);
  }

  /** PLC 블록 하나를 입력 레지스터(FC4)에서 읽는다. */
  async pollPlc(connection: IngestConnection): Promise<ModbusRawMessage> {
    const config = connection.config as ModbusConnectionConfig;
    const registers = await this.modbusClientRepository.readInputRegisters(
      connection.id,
      this.toTarget(config),
      config.baseAddress,
      config.blockSize,
    );

    return { firstBlock: 0, blockSize: config.blockSize, registers };
  }

  /** 접속을 끊는다. REST는 붙어 있는 접속이 없다. */
  async close(connection: IngestConnection): Promise<void> {
    if (connection.protocol === "MQTT") {
      await this.mqttClientRepository.unsubscribe(connection.id);
    } else if (connection.protocol === "MODBUS_TCP") {
      await this.modbusClientRepository.disconnect(connection.id);
    }
  }

  /** bulk는 전체 목록 1회, each는 차량마다 1회. */
  private async pollRest(
    config: RestConnectionConfig,
    externalIds: string[],
  ): Promise<RestRawMessage[]> {
    if (config.mode === "bulk") {
      const url = `${config.baseUrl}/api/vehicles`;
      return [await this.restClientRepository.get(url, config.timeoutMs)];
    }

    const requests = externalIds.map((externalId) => {
      const url = `${config.baseUrl}/api/vehicles/${externalId}`;
      return this.restClientRepository.get(url, config.timeoutMs);
    });
    return await Promise.all(requests);
  }

  /** 로봇 블록들을 홀딩 레지스터(FC3)에서 읽는다. 블록이 요청 사이에 쪼개지지 않아 차량 값과 seq가 어긋나지 않는다. */
  private async pollModbusBlocks(
    connectionId: string,
    config: ModbusConnectionConfig,
    blockNumbers: number[],
  ): Promise<ModbusRawMessage[]> {
    if (blockNumbers.length === 0) {
      return [];
    }

    const firstBlock = blockNumbers.reduce((a, b) => Math.min(a, b));
    const lastBlock = blockNumbers.reduce((a, b) => Math.max(a, b));
    const blocksPerRead = Math.floor(
      DeviceTransportProvider.MAX_REGISTERS_PER_READ / config.blockSize,
    );
    const readCount = Math.ceil((lastBlock - firstBlock + 1) / blocksPerRead);
    const starts = Array.from(
      { length: readCount },
      (_, index) => firstBlock + index * blocksPerRead,
    );

    // 한 접속에 요청을 하나씩 보내야 해서 차례로 읽는다.
    const raws: ModbusRawMessage[] = [];
    for (const start of starts) {
      const count = Math.min(blocksPerRead, lastBlock - start + 1);
      raws.push(await this.readBlocks(connectionId, config, start, count));
    }

    return raws;
  }

  private async readBlocks(
    connectionId: string,
    config: ModbusConnectionConfig,
    firstBlock: number,
    count: number,
  ): Promise<ModbusRawMessage> {
    const registers = await this.modbusClientRepository.readHoldingRegisters(
      connectionId,
      this.toTarget(config),
      config.baseAddress + firstBlock * config.blockSize,
      count * config.blockSize,
    );

    return { firstBlock, blockSize: config.blockSize, registers };
  }

  private toTarget(config: ModbusConnectionConfig): ModbusTarget {
    return {
      host: config.host,
      port: config.port,
      unitId: config.unitId,
      timeoutMs: this.config.modbusReadTimeoutMs,
    };
  }
}
