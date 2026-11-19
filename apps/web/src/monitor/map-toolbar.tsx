import { KeyboardEvent, useState } from "react";
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

  const find = () => {
    if (query.trim()) {
      props.onFind(query);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      find();
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
        <input
          className="input mono"
          id="robotSearch"
          list="robotNames"
          placeholder="예: AMR A-001"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onBlur={find}
          onKeyDown={onKeyDown}
        />
        <datalist id="robotNames">
          {props.robots.map((robot) => (
            <option key={robot.id} value={robot.name} />
          ))}
        </datalist>
      </div>
    </div>
  );
};
