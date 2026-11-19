import { Injectable } from "@nestjs/common";
import {
  PlcDeviceLastRead,
  PlcPoint,
  PlcPointEntry,
  PlcPointValue,
} from "./plc-point-state";

/** PLC 점 현재 값(메모리). seq 기준은 16점을 한 번에 읽으므로 장비 단위로 둔다. */
@Injectable()
export class PlcPointStateRepository {
  private readonly entries = new Map<string, PlcPointEntry>();
  private readonly lastReadByDevice = new Map<string, PlcDeviceLastRead>();

  async register(point: PlcPoint): Promise<void> {
    this.entries.set(point.pointId, { ...point, current: null, rev: 0 });
  }

  async remove(pointId: string): Promise<void> {
    this.entries.delete(pointId);
  }

  async removeLastRead(deviceId: string): Promise<void> {
    this.lastReadByDevice.delete(deviceId);
  }

  async findById(pointId: string): Promise<PlcPointEntry | undefined> {
    return this.entries.get(pointId);
  }

  async findAll(): Promise<PlcPointEntry[]> {
    return [...this.entries.values()];
  }

  async updateValue(
    pointId: string,
    current: PlcPointValue,
    rev: number,
  ): Promise<void> {
    const entry = this.entries.get(pointId);
    if (!entry) {
      return;
    }

    entry.current = current;
    entry.rev = rev;
  }

  async findLastRead(deviceId: string): Promise<PlcDeviceLastRead | null> {
    return this.lastReadByDevice.get(deviceId) ?? null;
  }

  async updateLastRead(
    deviceId: string,
    last: PlcDeviceLastRead,
  ): Promise<void> {
    this.lastReadByDevice.set(deviceId, last);
  }
}
