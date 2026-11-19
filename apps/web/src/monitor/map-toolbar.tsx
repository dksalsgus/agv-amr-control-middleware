import { KeyboardEvent, SyntheticEvent, useState } from "react";
import {
  FILTER_STATES,
  OP_LABEL,
  VENDOR_KEYS,
  VENDOR_LABEL,
} from "./monitor.constants";
import { MapFilters, MapRobot, VendorKey } from "./monitor.types";

type Props = {
  robots: MapRobot[];
  filters: MapFilters;
  onToggleVendor: (vendor: VendorKey) => void;
  onToggleState: (state: string) => void;
  onReset: () => void;
  onFind: (query: string) => void;
};

const VendorSwatch = ({ vendor }: { vendor: VendorKey }) => {
  if (vendor === "A") {
    return <circle cx="5" cy="5" r="4.2" fill="#E7ECF1" />;
  }
  if (vendor === "B") {
    return <rect x="1" y="1" width="8" height="8" fill="#E7ECF1" />;
  }
  return <path d="M5 0.3 L9.7 5 L5 9.7 L0.3 5 Z" fill="#E7ECF1" />;
};

const StateSwatch = ({ state }: { state: string }) => {
  const color = `var(--st-${state.toLowerCase()})`;
  if (state === "STALE") {
    return (
      <circle
        cx="5"
        cy="5"
        r="4"
        style={{ fill: "none", stroke: color, strokeWidth: 1.6 }}
        strokeDasharray="2 1.5"
      />
    );
  }
  return (
    <circle
      cx="5"
      cy="5"
      r="4"
      style={{ fill: color, stroke: color, strokeWidth: 0 }}
    />
  );
};

/** 맵 위의 제조사·상태 필터와 로봇 찾기 */
export const MapToolbar = (props: Props) => {
  const [query, setQuery] = useState("");
  /** 사용자가 입력한 글자. 입력창에 들어오면 비워서 전체 목록을 보인다. */
  const [keyword, setKeyword] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const options = props.robots
    .filter((robot) =>
      robot.name.toUpperCase().includes(keyword.trim().toUpperCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const pick = (name: string) => {
    setQuery(name);
    setOpen(false);
    setActive(-1);
    props.onFind(name);
  };

  /** 목록이 닫혀 있을 때 입력창을 누르면 글자를 골라 두고 전체 목록을 연다. */
  const openAll = (event: SyntheticEvent<HTMLInputElement>) => {
    if (open) {
      return;
    }
    event.currentTarget.select();
    setKeyword("");
    setActive(-1);
    setOpen(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setOpen(true);
      setActive((current) =>
        Math.min(options.length - 1, Math.max(0, current + step)),
      );
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    const chosen = options[active];
    if (open && chosen) {
      pick(chosen.name);
      return;
    }
    if (query.trim()) {
      pick(query);
    }
  };

  return (
    <div className="map-toolbar">
      <div className="filter-group" role="group" aria-label="제조사 필터">
        <span className="filter-label">제조사</span>
        {VENDOR_KEYS.map((vendor) => (
          <button
            key={vendor}
            type="button"
            className="chip"
            aria-pressed={props.filters.vendors.has(vendor)}
            onClick={() => props.onToggleVendor(vendor)}
          >
            <svg
              className="swatch"
              width="10"
              height="10"
              viewBox="0 0 10 10"
              aria-hidden="true"
            >
              <VendorSwatch vendor={vendor} />
            </svg>
            {VENDOR_LABEL[vendor]}
          </button>
        ))}
      </div>
      <div className="filter-group" role="group" aria-label="상태 필터">
        <span className="filter-label">상태</span>
        {FILTER_STATES.map((state) => (
          <button
            key={state}
            type="button"
            className="chip"
            aria-pressed={props.filters.states.has(state)}
            onClick={() => props.onToggleState(state)}
          >
            <svg
              className="swatch"
              width="10"
              height="10"
              viewBox="0 0 10 10"
              aria-hidden="true"
            >
              <StateSwatch state={state} />
            </svg>
            {OP_LABEL[state]}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={props.onReset}
      >
        필터 초기화
      </button>
      <div className="map-search">
        <label htmlFor="robotSearch">로봇 찾기</label>
        <div className="map-search-box">
          <input
            className="input mono"
            id="robotSearch"
            role="combobox"
            aria-expanded={open}
            aria-controls="robotOptions"
            aria-autocomplete="list"
            aria-activedescendant={
              open && options[active] ? `robot-opt-${active}` : undefined
            }
            placeholder="예: AMR A-001"
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setKeyword(event.target.value);
              setActive(-1);
              setOpen(true);
            }}
            onFocus={openAll}
            onClick={openAll}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
          />
          {open && (
            <ul className="map-search-list" id="robotOptions" role="listbox">
              {options.length === 0 && (
                <li className="map-search-empty">일치하는 로봇 없음</li>
              )}
              {options.map((robot, index) => (
                <li
                  key={robot.id}
                  id={`robot-opt-${index}`}
                  role="option"
                  aria-selected={index === active}
                  className="mono"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    pick(robot.name);
                  }}
                >
                  {robot.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
