import { CSSProperties } from "react";
import { formatNumber } from "../common/utils/number.util";
import {
  LOG_LABEL,
  LOG_TYPES,
  TARGET_LABEL,
  TARGET_TYPES,
} from "./logs.constants";
import {
  LogFilter,
  LogTargetType,
  LogType,
  TargetOption,
  TypeCounts,
} from "./logs.types";
import { hasFilter } from "./logs.util";

type Props = {
  filter: LogFilter;
  counts: TypeCounts;
  options: Record<LogTargetType, TargetOption[]>;
  onType: (type: LogType | "ALL") => void;
  onTargetType: (type: LogTargetType | "ALL") => void;
  onTargetId: (id: string) => void;
  onReset: () => void;
  nameOf: (id: string) => string;
};

const CHIP_KEYS: (LogType | "ALL")[] = ["ALL"].concat(LOG_TYPES) as (
  | LogType
  | "ALL"
)[];

export const LogFilters = ({
  filter,
  counts,
  options,
  onType,
  onTargetType,
  onTargetId,
  onReset,
  nameOf,
}: Props) => {
  const targetType = filter.targetType;
  // 목록에 없는 대상(PLC 장비 등)으로 좁혔을 때도 고른 값이 보이게 한다.
  const list = targetType === "ALL" ? [] : options[targetType];
  const missing =
    filter.targetId !== "ALL" &&
    !list.some((option) => option.id === filter.targetId);
  return (
    <div className="filters">
      <div className="filter-row" role="group" aria-label="로그 유형">
        <span className="filter-label">유형</span>
        <div
          className="od-cluster"
          style={{ "--od-gap": "6px" } as CSSProperties}
          id="typeChips"
        >
          {CHIP_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className="chip"
              data-type={key}
              aria-pressed={filter.type === key}
              onClick={() => key !== filter.type && onType(key)}
            >
              {key === "ALL" ? "전체" : LOG_LABEL[key]}{" "}
              {counts[key] !== undefined && (
                <span className="count">{formatNumber(counts[key])}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-row">
        <span className="filter-label">대상</span>
        <div className="field-inline">
          <label htmlFor="ttSelect">대상 유형</label>
          <select
            className="select"
            id="ttSelect"
            value={targetType}
            onChange={(event) =>
              onTargetType(event.target.value as LogTargetType | "ALL")
            }
          >
            <option value="ALL">전체</option>
            {TARGET_TYPES.map((type) => (
              <option key={type} value={type}>
                {TARGET_LABEL[type]} ({type})
              </option>
            ))}
          </select>
        </div>
        <div className="field-inline">
          <label htmlFor="tnSelect">대상 이름</label>
          <select
            className="select wide"
            id="tnSelect"
            value={filter.targetId}
            disabled={targetType === "ALL"}
            onChange={(event) => onTargetId(event.target.value)}
          >
            {targetType === "ALL" ? (
              <option value="ALL">대상 유형을 먼저 고르세요</option>
            ) : (
              <>
                <option value="ALL">
                  {TARGET_LABEL[targetType]} 전체 ({list.length})
                </option>
                {missing && (
                  <option value={filter.targetId}>
                    {nameOf(filter.targetId)}
                  </option>
                )}
                {list.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          id="resetBtn"
          disabled={!hasFilter(filter)}
          onClick={onReset}
        >
          필터 초기화
        </button>
      </div>
    </div>
  );
};
