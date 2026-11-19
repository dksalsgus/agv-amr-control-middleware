import { Injectable } from "@nestjs/common";
import {
  ModbusClientRepository,
  ModbusTarget,
} from "../repositories/modbus-client.repository";

/** vendors_connections.config의 MODBUS_TCP 모양 */
export type ModbusConnectionConfig = {
  host: string;
  port: number;
  unitId: number;
  pollIntervalMs: number;
  baseAddress: number;
  blockSize: number;
};

/** 한 번 읽은 결과. firstBlock부터 연속된 블록의 레지스터 */
export type ModbusRawMessage = {
  firstBlock: number;
  blockSize: number;
  registers: number[];
};

/** Modbus 한 요청의 레지스터 수 상한 */
const MAX_REGISTERS_PER_READ = 125;
const READ_TIMEOUT_MS = 800;

/** 블록 단위로 폴링한다. 블록이 요청 사이에 쪼개지지 않아 차량 값과 seq가 어긋나지 않는다. */
@Injectable()
export class ModbusLinkProvider {
  constructor(
    private readonly modbusClientRepository: ModbusClientRepository,
  ) {}

  /** 로봇 블록들을 홀딩 레지스터(FC3)에서 읽는다. */
  async poll(
    connectionId: string,
    config: ModbusConnectionConfig,
    blockNumbers: number[],
  ): Promise<ModbusRawMessage[]> {
    if (blockNumbers.length === 0) {
      return [];
    }

    const firstBlock = Math.min(...blockNumbers);
    const lastBlock = Math.max(...blockNumbers);
    const blocksPerRead = Math.floor(MAX_REGISTERS_PER_READ / config.blockSize);
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

  /** PLC처럼 블록 하나를 입력 레지스터(FC4)에서 읽는다. */
  async pollInputBlock(
    connectionId: string,
    config: ModbusConnectionConfig,
  ): Promise<ModbusRawMessage> {
    const registers = await this.modbusClientRepository.readInputRegisters(
      connectionId,
      await this.toTarget(config),
      config.baseAddress,
      config.blockSize,
    );

    return { firstBlock: 0, blockSize: config.blockSize, registers };
  }

  async disconnect(connectionId: string): Promise<void> {
    await this.modbusClientRepository.disconnect(connectionId);
  }

  private async readBlocks(
    connectionId: string,
    config: ModbusConnectionConfig,
    firstBlock: number,
    count: number,
  ): Promise<ModbusRawMessage> {
    const registers = await this.modbusClientRepository.readHoldingRegisters(
      connectionId,
      await this.toTarget(config),
      config.baseAddress + firstBlock * config.blockSize,
      count * config.blockSize,
    );

    return { firstBlock, blockSize: config.blockSize, registers };
  }

  private async toTarget(
    config: ModbusConnectionConfig,
  ): Promise<ModbusTarget> {
    return {
      host: config.host,
      port: config.port,
      unitId: config.unitId,
      timeoutMs: READ_TIMEOUT_MS,
    };
  }
}
