import { FaultSettings } from "./fault-settings";
import { FAULT_GROUPS, FaultConfig, FaultGroup } from "./fault.types";

/** PUT 본문 검증. 틀리면 이유 목록을 돌려준다. */
export class FaultConfigParser {
  parseGroup(value: string): FaultGroup | null {
    return FAULT_GROUPS.find((group) => group === value) ?? null;
  }

  parse(body: unknown): { config: FaultConfig } | { errors: string[] } {
    if (typeof body !== "object" || body === null) {
      return { errors: ["본문은 JSON 객체여야 합니다."] };
    }

    const record = body as Record<string, unknown>;
    const errors: string[] = [];
    if (typeof record.disconnected !== "boolean") {
      errors.push("disconnected는 true 또는 false");
    }
    this.checkRange(record, "delayMs", FaultSettings.MAX_DELAY_MS, errors);
    this.checkRange(record, "duplicatePct", 100, errors);
    this.checkRange(record, "reorderPct", 100, errors);
    this.checkRange(record, "lossPct", 100, errors);
    if (errors.length > 0) {
      return { errors };
    }

    return {
      config: {
        disconnected: record.disconnected as boolean,
        delayMs: record.delayMs as number,
        duplicatePct: record.duplicatePct as number,
        reorderPct: record.reorderPct as number,
        lossPct: record.lossPct as number,
      },
    };
  }

  private checkRange(
    record: Record<string, unknown>,
    key: string,
    max: number,
    errors: string[],
  ) {
    const value = record[key];
    if (typeof value !== "number" || !Number.isInteger(value)) {
      errors.push(`${key}는 정수`);
      return;
    }
    if (value < 0 || value > max) {
      errors.push(`${key}는 0~${max}`);
    }
  }
}
