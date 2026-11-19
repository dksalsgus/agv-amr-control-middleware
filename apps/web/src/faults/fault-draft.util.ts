import { formatNumber } from "../common/utils/number.util";
import { FIELDS } from "./faults.constants";
import {
  FaultConfig,
  FaultDraft,
  FaultErrors,
  FieldDef,
  GroupState,
  Preset,
} from "./faults.types";

export const toDraft = (config: FaultConfig): FaultDraft => ({
  disconnected: config.disconnected,
  delayMs: String(config.delayMs),
  duplicatePct: String(config.duplicatePct),
  reorderPct: String(config.reorderPct),
  lossPct: String(config.lossPct),
});

export const parseDraft = (draft: FaultDraft): FaultConfig => ({
  disconnected: draft.disconnected,
  delayMs: Number(draft.delayMs),
  duplicatePct: Number(draft.duplicatePct),
  reorderPct: Number(draft.reorderPct),
  lossPct: Number(draft.lossPct),
});

/** 걸린 장애를 "연결 끊김", "중복 30%"처럼 나열한다. */
export const faultsOf = (config: FaultConfig): string[] => {
  const list = config.disconnected ? ["연결 끊김"] : [];
  FIELDS.forEach((field) => {
    if (config[field.key] > 0) {
      list.push(
        `${field.short} ${formatNumber(config[field.key])}${field.unit}`,
      );
    }
  });
  return list;
};

const rangeText = (field: FieldDef) =>
  `${formatNumber(field.min)}~${formatNumber(field.max)}${field.unit}`;

export const checkField = (field: FieldDef, raw: string): string => {
  const text = raw.trim();
  if (text === "") {
    return `값을 입력하세요. ${rangeText(field)}`;
  }
  if (!/^\d+$/.test(text)) {
    return `0 이상의 정수만 입력하세요. ${rangeText(field)}`;
  }
  const value = Number(text);
  if (value < field.min || value > field.max) {
    return `${rangeText(field)} 사이로 입력하세요. 지금 값: ${formatNumber(value)}`;
  }
  return "";
};

export const validateDraft = (draft: FaultDraft): FaultErrors => {
  const errors: FaultErrors = {};
  FIELDS.forEach((field) => {
    const message = checkField(field, draft[field.key]);
    if (message) {
      errors[field.key] = message;
    }
  });
  return errors;
};

export const changedCount = (group: GroupState): number => {
  const disconnected =
    group.draft.disconnected !== group.applied.disconnected ? 1 : 0;
  return FIELDS.reduce(
    (count, field) =>
      group.draft[field.key].trim() !== String(group.applied[field.key])
        ? count + 1
        : count,
    disconnected,
  );
};

/** 빠른 설정의 값이 모두 적용되어 있으면 눌린 상태다. */
export const presetActive = (preset: Preset, applied: FaultConfig): boolean =>
  Object.entries(preset.patch).every(
    ([key, value]) => applied[key as keyof FaultConfig] === value,
  );
