import { formatTime } from "../common/utils/format.util";
import { Icon } from "../components/icon";
import { FaultGroup, GroupState } from "./faults.types";
import { changedCount, faultsOf } from "./fault-draft.util";

type Props = {
  group: FaultGroup;
  state: GroupState;
  onRevert: () => void;
  onNormal: () => void;
  onApply: () => void;
};

const FootState = ({
  group,
  state,
}: {
  group: FaultGroup;
  state: GroupState;
}) => {
  const changed = changedCount(state);
  if (state.phase === "applying") {
    return (
      <span className="foot-state" data-tone="info" role="status">
        <span className="spin" aria-hidden="true" />
        적용 중 · <span className="mono">PUT /faults/{group}</span>
      </span>
    );
  }
  if (state.phase === "failed") {
    return (
      <span className="foot-state" data-tone="danger" role="status">
        <Icon name="unplug" />
        적용하지 못했습니다 · {state.failReason}
      </span>
    );
  }
  if (changed > 0) {
    return (
      <span className="foot-state" data-tone="warn">
        <Icon name="edit" />
        바뀐 항목 {changed}개 · 아직 적용 전
      </span>
    );
  }
  if (state.phase === "applied" && state.appliedAt !== null) {
    return (
      <span className="foot-state" data-tone="ok" role="status">
        <Icon name="check" />
        {formatTime(state.appliedAt)} 적용됨
      </span>
    );
  }
  return <span className="foot-state">에뮬레이터 값과 같음</span>;
};

export const FaultGroupFoot = ({
  group,
  state,
  onRevert,
  onNormal,
  onApply,
}: Props) => {
  const changed = changedCount(state);
  const busy = state.phase === "applying";
  const hasFault = faultsOf(state.applied).length > 0;
  const invalid = Object.keys(state.errors).length > 0;

  return (
    <div className="gcard-foot">
      <FootState group={group} state={state} />
      <div className="foot-actions">
        {changed > 0 && (
          <button
            type="button"
            className="btn btn-sm"
            disabled={busy}
            onClick={onRevert}
          >
            되돌리기
          </button>
        )}
        <button
          type="button"
          className="btn btn-sm"
          disabled={busy || (!hasFault && changed === 0)}
          onClick={onNormal}
        >
          모두 정상으로
        </button>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          disabled={busy || changed === 0 || invalid}
          onClick={onApply}
        >
          {state.phase === "failed" && changed > 0 ? "다시 적용" : "적용"}
        </button>
      </div>
    </div>
  );
};
