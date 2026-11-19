import { formatNumber } from "../common/utils/number.util";
import { Icon } from "../components/icon";
import { FaultGroup, FieldDef, GroupState } from "./faults.types";

type Props = {
  group: FaultGroup;
  field: FieldDef;
  state: GroupState;
  onChange: (raw: string) => void;
  onEnter: () => void;
};

export const FaultFieldRow = ({
  group,
  field,
  state,
  onChange,
  onEnter,
}: Props) => {
  const id = `f-${group}-${field.key}`;
  const error = state.errors[field.key];
  const value = state.draft[field.key];
  const text = value.trim();
  const rangeValue = /^\d+$/.test(text) ? Math.min(field.max, Number(text)) : 0;

  return (
    <div className="frow">
      <div className="frow-label">
        <label htmlFor={id}>
          {field.label}
          {state.applied[field.key] > 0 && (
            <span className="fault-tag">적용 중</span>
          )}
        </label>
        <span className="frow-key">{field.key}</span>
      </div>
      <div className="frow-ctrl">
        {field.range && (
          <input
            type="range"
            min={field.min}
            max={field.max}
            step={1}
            value={rangeValue}
            aria-label={`${field.label} 슬라이더`}
            aria-describedby={`${id}-hint`}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
        <div className="num-group">
          <input
            className="num"
            id={id}
            type="text"
            inputMode="numeric"
            value={value}
            aria-describedby={`${id}-hint ${id}-err`}
            aria-invalid={Boolean(error)}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onEnter();
              }
            }}
          />
          <span className="addon" aria-hidden="true">
            {field.unit}
          </span>
        </div>
        {field.quick.length > 0 && (
          <div className="quick">
            {field.quick.map((quick) => (
              <button
                key={quick}
                type="button"
                className="chip"
                aria-pressed={text === String(quick)}
                onClick={() => onChange(String(quick))}
              >
                {formatNumber(quick)}
              </button>
            ))}
          </div>
        )}
      </div>
      <span className="frow-hint" id={`${id}-hint`} style={{ gridColumn: 2 }}>
        {field.hint} · {formatNumber(field.min)}~{formatNumber(field.max)}
        {field.unit}
      </span>
      <span className="frow-err" id={`${id}-err`} hidden={!error}>
        {error && (
          <>
            <Icon name="critical" />
            <span>{error}</span>
          </>
        )}
      </span>
    </div>
  );
};
