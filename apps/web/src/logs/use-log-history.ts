import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiRequestError } from "../api/api-request.error";
import { connectionsApi } from "../connections/connections.api";
import { ConnectionItem } from "../connections/connections.types";
import { RealtimeView } from "../realtime/realtime.types";
import { LOG_TYPES, PAGE_SIZE, RECENT_COUNT } from "./logs.constants";
import { logsApi } from "./logs.api";
import {
  LoadFailure,
  LoadStatus,
  LogFilter,
  LogItem,
  LogTargetType,
  LogType,
  TargetOption,
  TypeCounts,
} from "./logs.types";
import {
  ALL_FILTER,
  connectionOptions,
  plcPointOptions,
  robotOptions,
  toLogsPath,
} from "./logs.util";

const toReason = (error: unknown): string => {
  if (error instanceof ApiRequestError) {
    return `${error.status} ${error.message}`;
  }
  return error instanceof Error ? error.message : String(error);
};

/** 이력 화면의 조회 조건, 결과, 고른 기록을 한곳에서 다룬다. */
export const useLogHistory = (view: RealtimeView) => {
  const [filter, setFilter] = useState<LogFilter>(ALL_FILTER);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [items, setItems] = useState<LogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [failure, setFailure] = useState<LoadFailure | null>(null);
  const [counts, setCounts] = useState<TypeCounts>({});
  const [selected, setSelected] = useState<LogItem | null>(null);
  const [recent, setRecent] = useState<LogItem[]>([]);
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const pageReq = useRef(0);
  const countReq = useRef(0);
  const pendingFocus = useRef<string | null>(null);

  useEffect(() => {
    connectionsApi
      .findAll()
      .then(setConnections)
      .catch(() => setConnections([]));
  }, []);

  useEffect(() => {
    const req = ++pageReq.current;
    const query = { filter, page, size: PAGE_SIZE };
    setStatus("loading");
    logsApi
      .findPage(query)
      .then((result) => {
        if (req !== pageReq.current) {
          return;
        }
        const last = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
        if (page > last) {
          setPage(last);
          return;
        }
        setItems(result.items);
        setTotal(result.total);
        setStatus(result.total > 0 ? "ok" : "empty");
      })
      .catch((error: unknown) => {
        if (req !== pageReq.current) {
          return;
        }
        setFailure({
          request: `GET ${toLogsPath(query)}`,
          reason: toReason(error),
        });
        setStatus("error");
      });
  }, [filter, page, reloadKey]);

  // 유형 칩의 건수는 대상 조건만 건 상태에서 유형별로 센다.
  const { targetType, targetId } = filter;
  useEffect(() => {
    const req = ++countReq.current;
    const keys: (LogType | "ALL")[] = ["ALL"];
    LOG_TYPES.forEach((type) => keys.push(type));
    Promise.all(
      keys.map((type) => logsApi.count({ type, targetType, targetId })),
    )
      .then((values) => {
        if (req !== countReq.current) {
          return;
        }
        const next: TypeCounts = {};
        keys.forEach((key, index) => {
          next[key] = values[index];
        });
        setCounts(next);
      })
      .catch(() => {
        if (req === countReq.current) {
          setCounts({});
        }
      });
  }, [targetType, targetId, reloadKey]);

  const selectedTargetType = selected?.targetType;
  const selectedTargetId = selected?.targetId;
  useEffect(() => {
    if (!selectedTargetType || !selectedTargetId) {
      setRecent([]);
      return;
    }
    const recentFilter: LogFilter = {
      type: "ALL",
      targetType: selectedTargetType,
      targetId: selectedTargetId,
    };
    logsApi
      .findPage({ filter: recentFilter, page: 1, size: RECENT_COUNT })
      .then((result) => setRecent(result.items))
      .catch(() => setRecent([]));
  }, [selectedTargetType, selectedTargetId, reloadKey]);

  useEffect(() => {
    if (status === "loading" || !pendingFocus.current) {
      return;
    }
    const target = document.querySelector<HTMLElement>(pendingFocus.current);
    pendingFocus.current = null;
    target?.focus();
  }, [status]);

  const options = useMemo(
    () =>
      ({
        CONNECTION: connectionOptions(connections),
        DEVICE: robotOptions(view.robots),
        PLC_POINT: plcPointOptions(view.plcPoints),
      }) as Record<LogTargetType, TargetOption[]>,
    [connections, view.robots, view.plcPoints],
  );

  const names = useMemo(() => {
    const map = new Map<string, string>();
    Object.values(options).forEach((list) =>
      list.forEach((option) => map.set(option.id, option.name)),
    );
    return map;
  }, [options]);

  /** 이름을 모르는 대상(PLC 장비 등)은 id 앞부분을 보여 준다. */
  const nameOf = useCallback(
    (id: string) => names.get(id) ?? id.slice(0, 8),
    [names],
  );

  const applyFilter = (next: LogFilter, focus: string | null) => {
    pendingFocus.current = focus;
    setFilter(next);
    setPage(1);
  };

  const setType = (type: LogType | "ALL") =>
    applyFilter(
      { type, targetType: filter.targetType, targetId: filter.targetId },
      `#typeChips [data-type="${type}"]`,
    );

  const setTargetType = (next: LogTargetType | "ALL") =>
    applyFilter(
      { type: filter.type, targetType: next, targetId: "ALL" },
      "#ttSelect",
    );

  const setTargetId = (next: string) =>
    applyFilter(
      { type: filter.type, targetType: filter.targetType, targetId: next },
      "#tnSelect",
    );

  const reset = () => applyFilter(ALL_FILTER, '#typeChips [data-type="ALL"]');

  const scopeTo = (log: LogItem) => {
    setSelected(log);
    applyFilter(
      { type: "ALL", targetType: log.targetType, targetId: log.targetId },
      "#scopeTitle",
    );
  };

  const clearTarget = () =>
    applyFilter(
      { type: filter.type, targetType: "ALL", targetId: "ALL" },
      selected ? `#logBody tr[data-id="${selected.id}"]` : null,
    );

  const goPage = (next: number, focus: string) => {
    pendingFocus.current = focus;
    setPage(next);
  };

  const refresh = (focus: string | null) => {
    pendingFocus.current = focus;
    setReloadKey((key) => key + 1);
  };

  return {
    filter,
    page,
    status,
    items,
    total,
    failure,
    counts,
    selected,
    recent,
    options,
    nameOf,
    setType,
    setTargetType,
    setTargetId,
    reset,
    scopeTo,
    clearTarget,
    goPage,
    refresh,
    select: setSelected,
  };
};
