import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiRequestError } from "../api/api-request.error";
import { useNow } from "../common/hooks/use-now";
import { toggleInSet } from "../common/utils/set.util";
import { ConfirmRequest } from "../components/confirm-dialog";
import { ToastTone } from "../components/use-toasts";
import { Link } from "../realtime/realtime.types";
import {
  changedKeys,
  draftFromDetail,
  emptyDraft,
  labelOf,
  toWriteBody,
  validateAll,
  withValue,
  withVendorDefaults,
} from "./connection-draft.util";
import { conflictRows } from "./conflict.util";
import { DEFAULTS } from "./connections.constants";
import {
  ConnectionPhase,
  ConnectionRow,
  InvalidMessage,
  SaveFlow,
} from "./connections-view.types";
import { connectionsApi } from "./connections.api";
import {
  ConnectionDetail,
  ConnectionDraft,
  ConnectionItem,
  FieldErrors,
  VendorItem,
} from "./connections.types";
import { vendorsApi } from "./vendors.api";

/** 재연결 결과(UP·DOWN)를 이만큼 기다려도 안 오면 실패로 본다. */
const RECONNECT_TIMEOUT_MS = 15000;

type PendingToggle = {
  phase: ConnectionPhase;
  startedAt: number;
  name: string;
};

type Push = (text: string, tone: ToastTone) => void;

/** 재연결이 끝났는지: startedAt 뒤에 바뀐 링크 상태가 UP이나 DOWN이면 끝이다. */
const settledLink = (link: Link | undefined, since: number): Link | null => {
  if (!link || link.status === "UNKNOWN" || !link.changedAt) {
    return null;
  }
  return Date.parse(link.changedAt) >= since ? link : null;
};

const toRows = (
  items: ConnectionItem[],
  links: ReadonlyMap<string, Link>,
): ConnectionRow[] =>
  items.map((item) => {
    const link = links.get(item.id);
    return Object.assign({}, item, {
      status: link?.status ?? "UNKNOWN",
      changedAt: link ? link.changedAt : item.linkChangedAt,
    });
  });

const apiMessages = (error: unknown): string[] =>
  error instanceof ApiRequestError ? error.messages : ["요청이 실패했습니다."];

const statusOf = (error: unknown): number =>
  error instanceof ApiRequestError ? error.status : 0;

/** 연결 설정 화면의 상태와 동작. 디자인의 흐름을 실제 API로 옮겼다. */
export const useConnectionEditor = (
  links: ReadonlyMap<string, Link>,
  push: Push,
) => {
  const now = useNow(1000);
  const [items, setItems] = useState<ConnectionItem[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prevSelectedId, setPrevSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<ConnectionDetail | null>(null);
  const [draft, setDraft] = useState<ConnectionDraft | null>(null);
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [flow, setFlow] = useState<SaveFlow | null>(null);
  const [busy, setBusy] = useState(false);
  const [toggles, setToggles] = useState<ReadonlyMap<string, PendingToggle>>(
    new Map(),
  );
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  const rows = useMemo(() => toRows(items, links), [items, links]);
  const row = creating
    ? undefined
    : rows.find((item) => item.id === selectedId);
  const savedDraft = useMemo(
    () => (detail ? draftFromDetail(detail) : null),
    [detail],
  );
  const takenNames = useMemo(
    () =>
      rows
        .filter((item) => creating || item.id !== selectedId)
        .map((item) => item.name),
    [rows, creating, selectedId],
  );

  const refreshItems = useCallback(async () => {
    const next = await connectionsApi.findAll();
    setItems(next);
    return next;
  }, []);

  const showConnection = useCallback((next: ConnectionDetail) => {
    setSelectedId(next.id);
    setCreating(false);
    setDetail(next);
    setDraft(draftFromDetail(next));
    setTouched(new Set());
    setShowAll(false);
  }, []);

  const openConnection = useCallback(
    async (id: string) => {
      showConnection(await connectionsApi.findOne(id));
      setFlow(null);
    },
    [showConnection],
  );

  useEffect(() => {
    const load = async () => {
      const [list, vendorList] = await Promise.all([
        refreshItems(),
        vendorsApi.findAll(),
      ]);
      setVendors(vendorList);
      if (list.length > 0) {
        await openConnection(list[0].id);
      }
    };
    load().catch((error: unknown) =>
      console.warn("연결 설정 불러오기 실패", error),
    );
  }, [refreshItems, openConnection]);

  // 저장 뒤 재연결 결과를 실시간 링크 상태로 확인한다.
  useEffect(() => {
    if (
      !selectedId ||
      (flow?.phase !== "reconnecting" && flow?.phase !== "createdWaiting")
    ) {
      return;
    }
    const link = settledLink(links.get(selectedId), flow.startedAt);
    if (!link && now - flow.startedAt <= RECONNECT_TIMEOUT_MS) {
      return;
    }
    const at = link?.changedAt ? Date.parse(link.changedAt) : now;
    const up = link?.status === "UP";
    const version = flow.phase === "reconnecting" ? flow.version : 1;
    const name = rows.find((item) => item.id === selectedId)?.name ?? "";
    setBusy(false);
    if (up && flow.phase === "createdWaiting") {
      setFlow({ phase: "created", reconnectedAt: flow.startedAt, at });
      push(`${name} 연결을 만들고 UP을 확인했습니다.`, "ok");
    } else if (up) {
      setFlow({ phase: "done", version, reconnectedAt: flow.startedAt, at });
      push(`${name} v${version} — 새 설정으로 UP 확인`, "ok");
    } else {
      setFlow({
        phase: "failed",
        version,
        reconnectedAt: flow.startedAt,
        at,
        created: flow.phase === "createdWaiting",
      });
      push(`${name} — 새 설정으로 연결하지 못했습니다 (DOWN).`, "danger");
    }
    void refreshItems();
  }, [flow, links, now, selectedId, rows, push, refreshItems]);

  // 켬·끔 스위치 결과를 실시간 링크 상태로 확인한다.
  useEffect(() => {
    const finished = Array.from(toggles.entries()).filter(([id, pending]) => {
      if (now - pending.startedAt > RECONNECT_TIMEOUT_MS) {
        return true;
      }
      if (pending.phase === "stopping") {
        return !links.has(id);
      }
      return settledLink(links.get(id), pending.startedAt) !== null;
    });
    if (finished.length === 0) {
      return;
    }
    finished.forEach(([id, pending]) => {
      const status = links.get(id)?.status ?? "UNKNOWN";
      if (pending.phase === "stopping") {
        push(`${pending.name} 끔 — 어댑터를 내렸습니다 (UNKNOWN)`, "info");
        return;
      }
      push(
        `${pending.name} 켬 — 다시 붙어 ${status}`,
        status === "UP" ? "ok" : "danger",
      );
    });
    setToggles((current) => {
      const next = new Map(current);
      finished.forEach(([id]) => next.delete(id));
      return next;
    });
    void refreshItems();
  }, [toggles, links, now, push, refreshItems]);

  const allErrors: FieldErrors = useMemo(
    () => (draft ? validateAll(draft, creating, takenNames) : {}),
    [draft, creating, takenNames],
  );
  const errors: FieldErrors = Object.fromEntries(
    Object.entries(allErrors).filter(([key]) => showAll || touched.has(key)),
  );
  const changed =
    draft && savedDraft && !creating ? changedKeys(draft, savedDraft) : [];

  const hasUnsaved = (): boolean => {
    if (!draft) {
      return false;
    }
    if (!creating) {
      return changed.length > 0;
    }
    const defaults = DEFAULTS[draft.protocol];
    return (
      draft.name.trim() !== "" ||
      Object.keys(defaults).some((key) => draft.config[key] !== defaults[key])
    );
  };

  /** 저장하지 않은 변경이 있으면 버릴지 먼저 묻는다. */
  const guardUnsaved = (proceed: () => void) => {
    if (!hasUnsaved()) {
      proceed();
      return;
    }
    setConfirm({
      title: "저장하지 않은 변경 사항이 있습니다",
      body: (
        <p>
          지금 이동하면 편집한 내용이 사라집니다. 저장하려면 취소를 누르고
          저장하세요.
        </p>
      ),
      confirmLabel: "버리고 이동",
      onConfirm: proceed,
    });
  };

  const select = (id: string) => {
    if (busy) {
      push("저장이 끝난 뒤에 다른 연결을 열 수 있습니다.", "warn");
      return;
    }
    if (!creating && id === selectedId) {
      return;
    }
    guardUnsaved(() => void openConnection(id));
  };

  const startCreate = () => {
    if (busy) {
      return;
    }
    guardUnsaved(() => {
      setPrevSelectedId(selectedId);
      setCreating(true);
      setDetail(null);
      setDraft(
        withVendorDefaults(emptyDraft(vendors[0]?.id ?? ""), vendors[0]),
      );
      setTouched(new Set());
      setShowAll(false);
      setFlow(null);
    });
  };

  const cancelCreate = () => {
    guardUnsaved(() => {
      const fallback = prevSelectedId ?? rows[0]?.id;
      if (fallback) {
        void openConnection(fallback);
      }
    });
  };

  /** 끝난 저장 안내는 다시 고치기 시작하면 치운다. */
  const clearFinishedFlow = () => {
    const finished = ["done", "created", "savedDisabled", "rebased"];
    if (flow && finished.includes(flow.phase)) {
      setFlow(null);
    }
  };

  /** 새 연결은 고른 제조사, 기존 연결은 그 연결의 제조사 */
  const findVendor = (target: ConnectionDraft): VendorItem | undefined =>
    creating
      ? vendors.find((vendor) => vendor.id === target.vendorId)
      : vendors.find((vendor) => vendor.code === detail?.vendorCode);

  const change = (key: string, value: string) => {
    if (!draft) {
      return;
    }
    const next = withValue(draft, key, value);
    const isConnectionTarget = key === "protocol" || key === "vendorId";
    setDraft(
      isConnectionTarget ? withVendorDefaults(next, findVendor(next)) : next,
    );
    clearFinishedFlow();
    if (key === "protocol") {
      setTouched(
        new Set(Array.from(touched).filter((item) => !item.startsWith("cfg."))),
      );
    }
  };

  const blur = (key: string) => {
    if (!touched.has(key)) {
      setTouched(toggleInSet(touched, key));
    }
    if (flow?.phase === "invalid" && Object.keys(allErrors).length === 0) {
      setFlow(null);
    }
  };

  const revert = () => {
    if (!detail) {
      return;
    }
    setDraft(draftFromDetail(detail));
    setTouched(new Set());
    setShowAll(false);
    setFlow(null);
    push("저장된 값으로 되돌렸습니다.", "info");
  };

  const showInvalid = (messages: InvalidMessage[]) => {
    setShowAll(true);
    setFlow({ phase: "invalid", messages });
  };

  const handleConflict = async (current: ConnectionDetail) => {
    const latest = await connectionsApi.findOne(current.id);
    const mine = draft ?? draftFromDetail(latest);
    setFlow({
      phase: "conflict",
      from: current.version,
      to: latest.version,
      rows: conflictRows(
        mine,
        draftFromDetail(current),
        draftFromDetail(latest),
      ),
    });
    push(
      `409 버전 충돌 — 다른 사용자가 먼저 v${latest.version}로 수정했습니다.`,
      "warn",
    );
    void refreshItems();
  };

  const handleSaveError = async (
    error: unknown,
    current: ConnectionDetail | null,
  ) => {
    if (statusOf(error) === 409 && current) {
      await handleConflict(current);
      return;
    }
    if (statusOf(error) === 400) {
      showInvalid(
        apiMessages(error).map((text) => ({ key: null, label: "", text })),
      );
      return;
    }
    setFlow(null);
    push(`저장하지 못했습니다. ${apiMessages(error).join(", ")}`, "danger");
  };

  const saveExisting = async (
    current: ConnectionDetail,
    body: ReturnType<typeof toWriteBody>,
  ) => {
    const startedAt = Date.now();
    const result = await connectionsApi.update(
      current.id,
      current.version,
      body,
    );
    const next = await connectionsApi.findOne(current.id);
    showConnection(next);
    void refreshItems();
    if (!next.enabled) {
      setFlow({ phase: "savedDisabled", version: result.version });
      push(
        `${next.name} v${result.version} 저장 — 꺼져 있어 다시 붙지 않습니다.`,
        "info",
      );
      return false;
    }
    setFlow({ phase: "reconnecting", version: result.version, startedAt });
    return true;
  };

  const saveNew = async (
    current: ConnectionDraft,
    body: ReturnType<typeof toWriteBody>,
  ) => {
    const startedAt = Date.now();
    const result = await connectionsApi.create(
      current.vendorId,
      current.protocol,
      body,
    );
    const next = await connectionsApi.findOne(result.id);
    await refreshItems();
    showConnection(next);
    setFlow({ phase: "createdWaiting", startedAt });
  };

  const save = async () => {
    if (busy || !draft || (!creating && changed.length === 0)) {
      return;
    }
    const keys = Object.keys(allErrors);
    if (keys.length > 0) {
      showInvalid(
        keys.map((key) => ({
          key,
          label: labelOf(draft.protocol, key),
          text: allErrors[key],
        })),
      );
      return;
    }
    const body = toWriteBody(draft);
    const run = async (): Promise<boolean> => {
      if (creating) {
        await saveNew(draft, body);
        return true;
      }
      if (!detail) {
        return false;
      }
      return await saveExisting(detail, body);
    };
    setBusy(true);
    setFlow({ phase: "saving" });
    try {
      const waiting = await run();
      setBusy(waiting);
    } catch (error) {
      setBusy(false);
      await handleSaveError(error, creating ? null : detail);
    }
  };

  /** 연결 실패 뒤 "다시 시도": 같은 설정으로 version만 올려 다시 붙인다. */
  const retry = async () => {
    if (!detail) {
      return;
    }
    const startedAt = Date.now();
    setBusy(true);
    try {
      const result = await connectionsApi.update(detail.id, detail.version, {
        enabled: detail.enabled,
      });
      showConnection(await connectionsApi.findOne(detail.id));
      setFlow({ phase: "reconnecting", version: result.version, startedAt });
    } catch (error) {
      setBusy(false);
      await handleSaveError(error, detail);
    }
  };

  const reloadLatest = async () => {
    if (!detail) {
      return;
    }
    const latest = await connectionsApi.findOne(detail.id);
    showConnection(latest);
    setFlow(null);
    push(`최신 값 v${latest.version}를 불러왔습니다.`, "ok");
  };

  /** 409 뒤 내 편집을 그대로 두고 최신 version을 기준으로 삼는다. */
  const rebase = async () => {
    if (!detail) {
      return;
    }
    const latest = await connectionsApi.findOne(detail.id);
    setDetail(latest);
    setFlow({ phase: "rebased", to: latest.version });
  };

  const toggleEnabled = async (id: string) => {
    const target = rows.find((item) => item.id === id);
    if (!target || toggles.has(id)) {
      return;
    }
    const enabled = !target.enabled;
    const startedAt = Date.now();
    try {
      await connectionsApi.update(id, target.version, { enabled });
    } catch (error) {
      push(
        statusOf(error) === 409
          ? "다른 곳에서 먼저 고쳤습니다. 목록을 새로 불러왔습니다."
          : `바꾸지 못했습니다. ${apiMessages(error).join(", ")}`,
        "warn",
      );
      void refreshItems();
      return;
    }
    setToggles((current) =>
      new Map(current).set(id, {
        phase: enabled ? "reconnecting" : "stopping",
        startedAt,
        name: target.name,
      }),
    );
    push(
      enabled
        ? `${target.name} 켜는 중 — 어댑터를 다시 올립니다.`
        : `${target.name} 끄는 중 — 어댑터를 내립니다.`,
      "info",
    );
    await refreshItems();
    if (id === selectedId && detail && !creating) {
      const next = await connectionsApi.findOne(id);
      setDetail(next);
    }
  };

  const removeSelected = async (target: ConnectionRow) => {
    try {
      await connectionsApi.remove(target.id);
    } catch (error) {
      push(`삭제하지 못했습니다. ${apiMessages(error).join(", ")}`, "danger");
      return;
    }
    push(`${target.name} 연결을 삭제했습니다.`, "info");
    const list = await refreshItems();
    if (list.length > 0) {
      await openConnection(list[0].id);
    }
  };

  /** 장비가 딸린 연결은 지우지 않고 끄도록 안내한다(서버도 409로 막는다). */
  const askDelete = () => {
    if (!row || busy) {
      return;
    }
    if (row.deviceCount > 0 && !row.enabled) {
      setConfirm({
        title: "삭제할 수 없는 연결입니다",
        tone: "info",
        body: (
          <>
            <p>
              <strong>{row.name}</strong>에 장비 {row.deviceCount}대가 딸려 있어
              지울 수 없습니다.
            </p>
            <p>
              이미 enabled가 꺼져 있어 어댑터는 내려가 있습니다. 장비를 다른
              연결로 옮긴 뒤에 삭제할 수 있습니다.
            </p>
          </>
        ),
      });
      return;
    }
    if (row.deviceCount > 0) {
      setConfirm({
        title: "삭제하지 않고 끕니다",
        body: (
          <>
            <p>
              <strong>{row.name}</strong>에 장비 {row.deviceCount}대가 딸려 있어
              삭제하지 않습니다.
            </p>
            <p>
              대신 <strong>enabled를 끕니다</strong>. 어댑터가 내려가고 연결
              상태는 UNKNOWN이 되며, 설정과 장비 기록은 그대로 남습니다. 나중에
              목록의 토글로 다시 켤 수 있습니다.
            </p>
          </>
        ),
        confirmLabel: "enabled 끄기",
        onConfirm: () => void toggleEnabled(row.id),
      });
      return;
    }
    setConfirm({
      title: "연결을 삭제합니다",
      body: (
        <p>
          <strong>{row.name}</strong>에는 딸린 장비가 없어 바로 삭제합니다.
          설정(v{row.version})은 복구할 수 없습니다.
        </p>
      ),
      confirmLabel: "삭제",
      onConfirm: () => void removeSelected(row),
    });
  };

  const draftVendorName =
    vendors.find((vendor) => vendor.id === draft?.vendorId)?.name ?? "";

  return {
    rows,
    row,
    vendors,
    selectedId,
    creating,
    detail,
    draft,
    draftVendorName,
    errors,
    flow,
    busy,
    confirm,
    changedLabels: draft
      ? changed.map((key) => labelOf(draft.protocol, key))
      : [],
    phases: new Map(
      Array.from(toggles.entries()).map(([id, pending]) => [id, pending.phase]),
    ),
    closeConfirm: () => setConfirm(null),
    select,
    startCreate,
    cancelCreate,
    change,
    blur,
    revert,
    save,
    retry,
    reloadLatest,
    rebase,
    editAfterFailure: () => setFlow(null),
    toggleEnabled,
    askDelete,
  };
};
