import { FAULT_GROUPS, FaultConfig, FaultGroup } from "./fault.types";

/** 그룹별 장애 설정(메모리). 미들웨어는 이 설정을 모른다. */
export class FaultSettings {
  /** 지연은 스냅샷을 이만큼만 보관하므로 그 이상은 받지 않는다. */
  static readonly MAX_DELAY_MS = 10_000;

  private readonly configs = new Map<FaultGroup, FaultConfig>(
    FAULT_GROUPS.map((group) => [group, FaultSettings.normal()]),
  );

  get(group: FaultGroup): FaultConfig {
    return this.configs.get(group) ?? FaultSettings.normal();
  }

  getAll(): Record<FaultGroup, FaultConfig> {
    return {
      A: this.get("A"),
      B: this.get("B"),
      C: this.get("C"),
      PLC: this.get("PLC"),
    };
  }

  set(group: FaultGroup, config: FaultConfig) {
    this.configs.set(group, config);
  }

  private static normal(): FaultConfig {
    return {
      disconnected: false,
      delayMs: 0,
      duplicatePct: 0,
      reorderPct: 0,
      lossPct: 0,
    };
  }
}
