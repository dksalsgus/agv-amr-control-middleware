import { Injectable, OnModuleDestroy } from "@nestjs/common";
import ModbusRTU from "modbus-serial";

export type ModbusTarget = {
  host: string;
  port: number;
  unitId: number;
  timeoutMs: number;
};

/** 연결마다 Modbus 클라이언트 하나. 읽기 실패 시 닫고 다음 읽기 때 다시 붙는다. */
@Injectable()
export class ModbusClientRepository implements OnModuleDestroy {
  private readonly clients = new Map<string, ModbusRTU>();

  /** 홀딩 레지스터(FC3) */
  async readHoldingRegisters(
    connectionId: string,
    target: ModbusTarget,
    address: number,
    length: number,
  ): Promise<number[]> {
    try {
      const client = await this.getClient(connectionId, target);
      const result = await client.readHoldingRegisters(address, length);
      return result.data;
    } catch (error) {
      await this.close(connectionId);
      throw error;
    }
  }

  /** 입력 레지스터(FC4) */
  async readInputRegisters(
    connectionId: string,
    target: ModbusTarget,
    address: number,
    length: number,
  ): Promise<number[]> {
    try {
      const client = await this.getClient(connectionId, target);
      const result = await client.readInputRegisters(address, length);
      return result.data;
    } catch (error) {
      await this.close(connectionId);
      throw error;
    }
  }

  async onModuleDestroy() {
    for (const connectionId of [...this.clients.keys()]) {
      await this.close(connectionId);
    }
  }

  private async getClient(
    connectionId: string,
    target: ModbusTarget,
  ): Promise<ModbusRTU> {
    const existing = this.clients.get(connectionId);
    if (existing?.isOpen) {
      return existing;
    }

    const client = new ModbusRTU();
    this.clients.set(connectionId, client);

    await client.connectTCP(target.host, {
      port: target.port,
      timeout: target.timeoutMs,
    });
    client.setID(target.unitId);
    client.setTimeout(target.timeoutMs);

    return client;
  }

  private async close(connectionId: string): Promise<void> {
    const client = this.clients.get(connectionId);
    if (!client) {
      return;
    }

    this.clients.delete(connectionId);

    // 이미 끊긴 소켓은 close 콜백이 오지 않아 기다리면 멈춘다.
    if (!client.isOpen) {
      return;
    }

    await new Promise<void>((resolve) => client.close(() => resolve()));
  }
}
