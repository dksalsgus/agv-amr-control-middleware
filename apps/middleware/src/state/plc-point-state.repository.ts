import { Injectable } from "@nestjs/common";
import { PlcPoint, PlcPointEntry, PlcPointValue } from "./plc-point-state";

type SeqPoint = {
  seq: number;
  sourceTs: Date;
};

/**
 * PLC 점의 현재 값을 담는 메모리 저장소.
 * seq 판정 기준은 점이 아니라 PLC 장비 단위로 따로 든다(16점을 한 번에 읽으므로).
 * 메모리라 실제로는 동기지만 모든 레이어 메서드를 async로 두는 규칙을 따른다.
 */
@Injectable()
export class PlcPointStateRepository {
  private readonly entries = new Map<string, PlcPointEntry>();
  private readonly lastSeqByDevice = new Map<string, SeqPoint>();

  async register(point: PlcPoint): Promise<void> {
    this.entries.set(point.pointId, { ...point, current: null, rev: 0 });
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

  async findLastSeq(deviceId: string): Promise<SeqPoint | null> {
    return this.lastSeqByDevice.get(deviceId) ?? null;
  }

  async updateLastSeq(deviceId: string, last: SeqPoint): Promise<void> {
    this.lastSeqByDevice.set(deviceId, last);
  }
}
