import { PLC_POINT_COUNT } from "../config";
import {
  DeviceFaults,
  FAULT_GROUPS,
  FaultConfig,
  FaultGroup,
} from "./fault.types";

/** 그룹별 장애 설정과 장비 값 주입(메모리). 미들웨어는 이 설정을 모른다. */
export class FaultSettings {
  /** 지연은 스냅샷을 이만큼만 보관하므로 그 이상은 받지 않는다. */
  static readonly MAX_DELAY_MS = 10_000;

  private readonly configs = new Map<FaultGroup, FaultConfig>(
    FAULT_GROUPS.map((group) => [group, FaultSettings.normal()]),
  );

  /** PLC 16점의 현재 값. PLC 시뮬레이터가 이 배열을 그대로 쓴다. */
  readonly plcPoints: boolean[] = new Array<boolean>(PLC_POINT_COUNT).fill(
    false,
  );
  /** 오류를 넣은 로봇 serial */
  readonly robotErrors = new Set<string>();

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

  getDevices(): DeviceFaults {
    return {
      plcPointsOn: this.plcPoints.flatMap((on, pointNo) =>
        on ? [pointNo] : [],
      ),
      robotErrors: Array.from(this.robotErrors).sort(),
    };
  }

  setPlcPoint(pointNo: number, on: boolean) {
    this.plcPoints[pointNo] = on;
  }

  setRobotError(serial: string, error: boolean) {
    if (error) {
      this.robotErrors.add(serial);
      return;
    }
    this.robotErrors.delete(serial);
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
