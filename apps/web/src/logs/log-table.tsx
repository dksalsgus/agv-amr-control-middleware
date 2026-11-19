import { KeyboardEvent, useEffect, useRef } from "react";
import { formatMonthDayTime } from "../common/utils/format.util";
import { Icon } from "../components/icon";
import { ALARM_LABEL } from "../monitor/monitor.constants";
import { SevTag, TypeTag } from "./log-tags";
import {
  LOG_LABEL,
  SKELETON_ROWS,
  SKELETON_WIDTHS,
  TARGET_LABEL,
} from "./logs.constants";
import { LoadFailure, LoadStatus, LogFilter, LogItem } from "./logs.types";
import { hasFilter } from "./logs.util";

type Props = {
  status: LoadStatus;
  items: LogItem[];
  filter: LogFilter;
  page: number;
  failure: LoadFailure | null;
  selectedId: string | null;
  nameOf: (id: string) => string;
  onSelect: (log: LogItem) => void;
  onScope: (log: LogItem) => void;
  onReset: () => void;
  onRetry: () => void;
};

const SKELETON = Array.from({ length: SKELETON_ROWS }, (_, index) => index);

const conditionText = (filter: LogFilter, nameOf: (id: string) => string) => {
  const type = filter.type === "ALL" ? "전체" : LOG_LABEL[filter.type];
  if (filter.targetType === "ALL") {
    return `유형 ${type} · 대상 전체`;
  }
  const target =
    filter.targetId === "ALL"
      ? `${TARGET_LABEL[filter.targetType]} 전체`
      : nameOf(filter.targetId);
  return `유형 ${type} · 대상 ${target}`;
};

const moveFocus = (event: KeyboardEvent<HTMLTableRowElement>) => {
  const row = event.currentTarget;
  const next =
    event.key === "ArrowDown"
      ? row.nextElementSibling
      : row.previousElementSibling;
  if (next instanceof HTMLElement) {
    next.focus();
  }
};

const EmptyBox = ({
  filter,
  nameOf,
  onReset,
}: Pick<Props, "filter" | "nameOf" | "onReset">) => {
  const filtered = hasFilter(filter);
  return (
    <div className="state-box">
      <Icon name="search" size={32} />
      <strong>
        {filtered ? "조건에 맞는 이력이 없습니다" : "기록된 이력이 없습니다"}
      </strong>
      <span>
        {filtered
          ? "고른 조건으로는 기록이 없습니다. 유형이나 대상을 바꾸거나 필터를 초기화해 보세요."
          : "연결 상태가 바뀌거나 알람이 생기면 여기에 기록됩니다."}
      </span>
      <span className="mono">{conditionText(filter, nameOf)}</span>
      {filtered && (
        <div className="state-actions">
          <button type="button" className="btn" onClick={onReset}>
            필터 초기화
          </button>
        </div>
      )}
    </div>
  );
};

const ErrorBox = ({ failure, onRetry }: Pick<Props, "failure" | "onRetry">) => (
  <div className="state-box" data-tone="danger" role="alert">
    <Icon name="critical" size={32} />
    <strong>이력을 불러오지 못했습니다</strong>
    <span>
      서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도하세요. 필터 조건은
      그대로 유지됩니다.
    </span>
    {failure && (
      <span className="mono">
        {failure.request} → {failure.reason}
      </span>
    )}
    <div className="state-actions">
      <button type="button" className="btn btn-primary" onClick={onRetry}>
        <Icon name="refresh" />
        다시 시도
      </button>
    </div>
  </div>
);

export const LogTable = ({
  status,
  items,
  filter,
  page,
  failure,
  selectedId,
  nameOf,
  onSelect,
  onScope,
  onReset,
  onRetry,
}: Props) => {
  const wrapRef = useRef<HTMLDivElement>(null);

  // 조건이나 쪽이 바뀌면 표를 맨 위부터 보여 준다.
  useEffect(() => {
    if (wrapRef.current) {
      wrapRef.current.scrollTop = 0;
    }
  }, [filter, page]);

  const keyDown = (event: KeyboardEvent<HTMLTableRowElement>, log: LogItem) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(log);
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(event);
    }
  };

  const showTable = status === "loading" || status === "ok";

  return (
    <div className="table-wrap" ref={wrapRef} aria-busy={status === "loading"}>
      {showTable && (
        <table className="log-table">
          <thead>
            <tr>
              <th scope="col">발생 시각</th>
              <th scope="col">유형</th>
              <th scope="col">등급</th>
              <th scope="col">알람 코드</th>
              <th scope="col">대상</th>
              <th scope="col">메시지</th>
            </tr>
          </thead>
          <tbody id="logBody">
            {status === "loading"
              ? SKELETON.map((row) => (
                  <tr key={row} className="skel-row" aria-hidden="true">
                    {SKELETON_WIDTHS.map((width) => (
                      <td key={width}>
                        <span className="skel-bar" style={{ width }} />
                      </td>
                    ))}
                  </tr>
                ))
              : items.map((log) => (
                  <tr
                    key={log.id}
                    data-id={log.id}
                    tabIndex={0}
                    aria-selected={log.id === selectedId}
                    onClick={() => onSelect(log)}
                    onKeyDown={(event) => keyDown(event, log)}
                  >
                    <td className="c-ts">
                      {formatMonthDayTime(Date.parse(log.createdAt))}
                    </td>
                    <td className="c-type">
                      <TypeTag type={log.type} />
                      <small>{log.type}</small>
                    </td>
                    <td>
                      <SevTag level={log.level} />
                    </td>
                    <td className="c-code">
                      {log.alarmCode ? (
                        <>
                          {log.alarmCode}
                          <small>{ALARM_LABEL[log.alarmCode]}</small>
                        </>
                      ) : (
                        <span className="c-none" aria-label="해당 없음">
                          —
                        </span>
                      )}
                    </td>
                    <td className="c-target">
                      <span className="tt-badge">
                        {TARGET_LABEL[log.targetType]}
                      </span>
                      <button
                        type="button"
                        className="target-link"
                        title="이 대상의 이력만 보기"
                        onClick={(event) => {
                          event.stopPropagation();
                          onScope(log);
                        }}
                      >
                        {nameOf(log.targetId)}
                      </button>
                    </td>
                    <td className="c-msg">{log.message}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      )}
      {status === "empty" && (
        <EmptyBox filter={filter} nameOf={nameOf} onReset={onReset} />
      )}
      {status === "error" && <ErrorBox failure={failure} onRetry={onRetry} />}
    </div>
  );
};
