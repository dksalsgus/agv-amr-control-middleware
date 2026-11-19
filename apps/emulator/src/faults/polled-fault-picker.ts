import { rollPct } from "../common/utils/chance.util";
import { FaultSettings } from "./fault-settings";
import { FaultConfig } from "./fault.types";

type Snapshot<T> = { at: number; value: T };

/**
 * 폴링 방식(REST, Modbus)은 요청이 올 때 줄 값을 고르는 식으로 장애를 건다.
 * 지연은 delayMs 전의 스냅샷, 순서 뒤바뀜은 그보다 하나 앞 스냅샷, 중복은 직전에 준 값을 다시 준다.
 */
export class PolledFaultPicker<T> {
  private readonly snapshots: Snapshot<T>[] = [];
  private lastServed: T | null = null;

  push(at: Date, value: T) {
    this.snapshots.push({ at: at.getTime(), value });

    const oldest = at.getTime() - FaultSettings.MAX_DELAY_MS;
    while (this.snapshots.length > 1 && this.snapshots[0].at < oldest) {
      this.snapshots.shift();
    }
  }

  /** 스냅샷이 아직 없으면 null */
  pick(config: FaultConfig, now: number): T | null {
    if (this.lastServed !== null && rollPct(config.duplicatePct)) {
      return this.lastServed;
    }

    const index = this.findIndexAt(now - config.delayMs);
    if (index < 0) {
      return null;
    }

    const isReordered = index > 0 && rollPct(config.reorderPct);
    const chosen = this.snapshots[isReordered ? index - 1 : index].value;
    this.lastServed = chosen;
    return chosen;
  }

  /** at이 time 이하인 마지막 스냅샷. 모두 늦으면 가장 오래된 것 */
  private findIndexAt(time: number): number {
    if (this.snapshots.length === 0) {
      return -1;
    }

    return this.snapshots.reduce(
      (found, snapshot, index) => (snapshot.at <= time ? index : found),
      0,
    );
  }
}
