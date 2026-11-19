import { Injectable } from "@nestjs/common";
import { ModbusClientRepository } from "../repositories/modbus-client.repository";

/** vendors_connections.config의 MODBUS_TCP 모양(설계 문서 5장) */
export type ModbusConnectionConfig = {
  host: string;
  port: number;
  unitId: number;
  pollIntervalMs: number;
  baseAddress: number;
  blockSize: number;
};

/** 한 번의 읽기 결과. firstBlock부터 연속된 블록의 레지스터가 이어 붙어 있다. */
export type ModbusRawMessage = {
  firstBlock: number;
  blockSize: number;
  registers: number[];
};

/** Modbus 한 요청으로 읽을 수 있는 레지스터 수의 상한 */
const MAX_REGISTERS_PER_READ = 125;
const READ_TIMEOUT_MS = 800;

/**
 * 블록 단위 레지스터를 한 번 폴링한다. 한 요청이 125레지스터를 넘지 않게 블록을 나눠 읽는다.
 * 블록이 요청 사이에 쪼개지지 않으므로 차량 한 대의 값과 seq는 항상 같은 요청에서 읽힌다.
 */
@Injectable()
export class ModbusLinkProvider {
  constructor(
    private readonly modbusClientRepository: ModbusClientRepository,
  ) {}

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

    const raws: ModbusRawMessage[] = [];
    for (let start = firstBlock; start <= lastBlock; start += blocksPerRead) {
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
      {
        host: config.host,
        port: config.port,
        unitId: config.unitId,
        timeoutMs: READ_TIMEOUT_MS,
      },
      config.baseAddress + firstBlock * config.blockSize,
      count * config.blockSize,
    );

    return { firstBlock, blockSize: config.blockSize, registers };
  }
}
