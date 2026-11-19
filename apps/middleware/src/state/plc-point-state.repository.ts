import { Injectable } from "@nestjs/common";
import { PlcPoint, PlcPointEntry, PlcPointValue } from "./plc-point-state";

type SeqPoint = {
  seq: number;
  sourceTs: Date;
};

/**
 * PLC 점의 현재 값을 담는 메모리 저장소.
 * seq 판정 기준은 점이 아니라 PLC 장비 단위로 따로 든다(16점을 한 번에 읽으므로).
 */
@Injectable()
export class PlcPointStateRepository {
  private readonly entries = new Map<string, PlcPointEntry>();
  private readonly lastSeqByDevice = new Map<string, SeqPoint>();

  register(point: PlcPoint) {
    this.entries.set(point.pointId, { ...point, current: null, rev: 0 });
  }

  findById(pointId: string): PlcPointEntry | undefined {
    return this.entries.get(pointId);
  }

  findAll(): PlcPointEntry[] {
    return [...this.entries.values()];
  }

  findByDevice(deviceId: string): PlcPointEntry[] {
    return this.findAll().filter((entry) => entry.deviceId === deviceId);
  }

  updateValue(pointId: string, current: PlcPointValue, rev: number) {
    const entry = this.entries.get(pointId);
    if (!entry) {
      return;
    }

    entry.current = current;
    entry.rev = rev;
  }

  findLastSeq(deviceId: string): SeqPoint | null {
    return this.lastSeqByDevice.get(deviceId) ?? null;
  }

  updateLastSeq(deviceId: string, last: SeqPoint) {
    this.lastSeqByDevice.set(deviceId, last);
  }
}
