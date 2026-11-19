import { CSSProperties } from "react";
import { Icon } from "../components/icon";
import { FIELDS } from "./faults.constants";
import { FaultNumberKey, GroupDef, GroupState } from "./faults.types";
import { faultsOf } from "./fault-draft.util";
import { FaultFieldRow } from "./fault-field-row";
import { FaultGroupFoot } from "./fault-group-foot";

type Props = {
  def: GroupDef;
  state: GroupState;
  onToggleDisconnected: () => void;
  onChange: (key: FaultNumberKey, raw: string) => void;
  onRevert: () => void;
  onNormal: () => void;
  onApply: () => void;
};

export const FaultGroupCard = ({
  def,
  state,
  onToggleDisconnected,
  onChange,
  onRevert,
  onNormal,
  onApply,
}: Props) => {
  const list = faultsOf(state.applied);
  const busy = state.phase === "applying";
  const id = def.id;

  return (
    <article
      className="gcard"
      id={`card-${id}`}
      data-fault={list.length > 0}
      aria-labelledby={`t-${id}`}
      aria-busy={busy}
    >
      <div className="gcard-head">
        <div
          className="od-stack"
          style={{ "--od-gap": "2px" } as CSSProperties}
        >
          <h3 className="gcard-title" id={`t-${id}`} tabIndex={-1}>
            {def.name}
          </h3>
          <span className="gcard-sub">
            {def.protocol} · {def.unit} · <span className="mono">{id}</span>
          </span>
        </div>
        {list.length > 0 ? (
          <span className="badge" data-tone="danger">
            <Icon name="warn" />
            장애 {list.length}개
          </span>
        ) : (
          <span className="badge" data-tone="ok">
            <Icon name="check" />
            정상
          </span>
        )}
      </div>
      <fieldset className="gcard-body" disabled={busy}>
        <legend className="sr-only">{def.name} 장애 설정</legend>
        <div className="frow">
          <div className="frow-label">
            <span className="lbl" id={`l-${id}-disc`}>
              연결 끊김
              {state.applied.disconnected && (
                <span className="fault-tag">적용 중</span>
              )}
            </span>
            <span className="frow-key">disconnected</span>
          </div>
          <div className="frow-ctrl">
            <span className="switch-wrap">
              <button
                type="button"
                className="switch"
                role="switch"
                aria-checked={state.draft.disconnected}
                aria-labelledby={`l-${id}-disc`}
                aria-describedby={`h-${id}-disc`}
                onClick={onToggleDisconnected}
              />
              <span aria-hidden="true">
                {state.draft.disconnected ? "켬 — 응답하지 않음" : "끔"}
              </span>
            </span>
          </div>
          <span
            className="frow-hint"
            id={`h-${id}-disc`}
            style={{ gridColumn: 2 }}
          >
            켜면 이 그룹의 장비가 모두 응답하지 않습니다.
          </span>
        </div>
        {FIELDS.map((field) => (
          <FaultFieldRow
            key={field.key}
            group={id}
            field={field}
            state={state}
            onChange={(raw) => onChange(field.key, raw)}
            onEnter={onApply}
          />
        ))}
      </fieldset>
      <FaultGroupFoot
        group={id}
        state={state}
        onRevert={onRevert}
        onNormal={onNormal}
        onApply={onApply}
      />
    </article>
  );
};
