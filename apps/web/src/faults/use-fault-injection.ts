import { useCallback, useEffect, useRef, useState } from "react";
import { ApiRequestError } from "../api/api-request.error";
import { ToastTone } from "../components/use-toasts";
import { FIELDS, GROUPS, NORMAL } from "./faults.constants";
import { faultsApi } from "./faults.api";
import {
  FaultConfig,
  FaultGroup,
  FaultNumberKey,
  GroupState,
  LoadStatus,
  Preset,
  RequestFailure,
} from "./faults.types";
import {
  changedCount,
  checkField,
  faultsOf,
  parseDraft,
  presetActive,
  toDraft,
  validateDraft,
} from "./fault-draft.util";

type Groups = Record<FaultGroup, GroupState>;
type Push = (text: string, tone: ToastTone) => void;

const toReason = (error: unknown): string => {
  if (error instanceof ApiRequestError) {
    return `${error.status} ${error.message}`;
  }
  return error instanceof Error ? error.message : String(error);
};

const groupName = (group: FaultGroup) =>
  GROUPS.find((def) => def.id === group)?.name ?? group;

const fresh = (applied: FaultConfig): GroupState => ({
  applied,
  draft: toDraft(applied),
  phase: "idle",
  appliedAt: null,
  errors: {},
  failReason: "",
});

/** 에뮬레이터 장애 설정을 읽고, 그룹별로 고쳐 적용한다. */
export const useFaultInjection = (push: Push) => {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [groups, setGroups] = useState<Groups | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [alert, setAlert] = useState<RequestFailure | null>(null);
  const loadReq = useRef(0);

  const patchGroup = (group: FaultGroup, patch: Partial<GroupState>) =>
    setGroups((current) => {
      if (!current) {
        return current;
      }
      const next = Object.assign({}, current);
      next[group] = Object.assign({}, current[group], patch);
      return next;
    });

  const load = useCallback(() => {
    const req = ++loadReq.current;
    setStatus("loading");
    faultsApi
      .findAll()
      .then((all) => {
        if (req !== loadReq.current) {
          return;
        }
        setGroups({
          A: fresh(all.A),
          B: fresh(all.B),
          C: fresh(all.C),
          PLC: fresh(all.PLC),
        });
        setFetchedAt(Date.now());
        setAlert(null);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (req !== loadReq.current) {
          return;
        }
        setStatus("error");
        setAlert({
          method: "GET",
          path: "/faults",
          reason: toReason(error),
          retry: load,
        });
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const put = (group: FaultGroup, values: FaultConfig, label: string) => {
    patchGroup(group, {
      phase: "applying",
      draft: toDraft(values),
      errors: {},
    });
    faultsApi
      .update(group, values)
      .then((applied) => {
        patchGroup(group, {
          applied,
          draft: toDraft(applied),
          phase: "applied",
          appliedAt: Date.now(),
          failReason: "",
        });
        setAlert((current) => (current?.method === "PUT" ? null : current));
        const list = faultsOf(applied);
        const head = `${groupName(group)}${label ? ` · ${label}` : ""}`;
        push(
          list.length > 0
            ? `${head} — 적용됨: ${list.join(", ")}`
            : `${head} — 정상으로 되돌렸습니다`,
          list.length > 0 ? "warn" : "ok",
        );
      })
      .catch((error: unknown) => {
        const reason = toReason(error);
        patchGroup(group, { phase: "failed", failReason: reason });
        setAlert({
          method: "PUT",
          path: `/faults/${group}`,
          reason,
          retry: () => put(group, values, label),
        });
        push(
          `${groupName(group)}: 에뮬레이터에 연결할 수 없어 적용하지 못했습니다.`,
          "danger",
        );
      });
  };

  /** 적용되었다는 표시는 다시 고치기 시작하면 내린다. */
  const editPhase = (state: GroupState) =>
    state.phase === "applied" ? "idle" : state.phase;

  const toggleDisconnected = (group: FaultGroup) => {
    if (!groups) {
      return;
    }
    const state = groups[group];
    patchGroup(group, {
      draft: Object.assign({}, state.draft, {
        disconnected: !state.draft.disconnected,
      }),
      phase: editPhase(state),
    });
  };

  const changeField = (group: FaultGroup, key: FaultNumberKey, raw: string) => {
    if (!groups) {
      return;
    }
    const state = groups[group];
    const field = FIELDS.find((def) => def.key === key);
    const message = field ? checkField(field, raw) : "";
    const errors = Object.assign({}, state.errors);
    if (message) {
      errors[key] = message;
    } else {
      delete errors[key];
    }
    const draft = Object.assign({}, state.draft);
    draft[key] = raw;
    patchGroup(group, { draft, errors, phase: editPhase(state) });
  };

  const revert = (group: FaultGroup) => {
    if (!groups) {
      return;
    }
    const state = groups[group];
    patchGroup(group, {
      draft: toDraft(state.applied),
      errors: {},
      phase: state.phase === "failed" ? "idle" : state.phase,
    });
  };

  const apply = (group: FaultGroup) => {
    if (!groups || changedCount(groups[group]) === 0) {
      return;
    }
    const errors = validateDraft(groups[group].draft);
    if (Object.keys(errors).length > 0) {
      patchGroup(group, { errors });
      return;
    }
    put(group, parseDraft(groups[group].draft), "");
  };

  const setNormal = (group: FaultGroup) => put(group, NORMAL, "모두 정상으로");

  const togglePreset = (preset: Preset) => {
    if (!groups) {
      return;
    }
    const applied = groups[preset.group].applied;
    const active = presetActive(preset, applied);
    const patch: Partial<FaultConfig> = {};
    Object.keys(preset.patch).forEach((key) => {
      const name = key as keyof FaultConfig;
      Object.assign(patch, {
        [name]: active ? NORMAL[name] : preset.patch[name],
      });
    });
    put(
      preset.group,
      Object.assign({}, applied, patch),
      active ? `${preset.label} 해제` : preset.label,
    );
  };

  const resetAll = () => {
    if (!groups) {
      return;
    }
    GROUPS.forEach((def) => {
      if (faultsOf(groups[def.id].applied).length > 0) {
        put(def.id, NORMAL, "전체 초기화");
      }
    });
  };

  const retryAlert = () => {
    if (!alert) {
      return;
    }
    setAlert(null);
    alert.retry();
  };

  return {
    status,
    groups,
    fetchedAt,
    alert,
    load,
    toggleDisconnected,
    changeField,
    revert,
    apply,
    setNormal,
    togglePreset,
    resetAll,
    retryAlert,
  };
};
