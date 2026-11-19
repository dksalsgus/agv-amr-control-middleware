import { Icon } from "../components/icon";
import { GROUPS } from "./faults.constants";
import { FaultGroup, GroupState, LoadStatus } from "./faults.types";
import { faultsOf } from "./fault-draft.util";

type Props = {
  status: LoadStatus;
  groups: Record<FaultGroup, GroupState> | null;
  /** 켜 둔 장비 값 주입(PLC 점, 로봇 오류) 수 */
  deviceOnCount: number;
  onGoto: (group: FaultGroup) => void;
};

export const FaultSummary = ({
  status,
  groups,
  deviceOnCount,
  onGoto,
}: Props) => {
  if (status === "error") {
    return (
      <div className="summary-card">
        <span className="summary-label">
          현재 값을 읽지 못해 장애 상태를 알 수 없습니다.
        </span>
      </div>
    );
  }
  if (status === "loading" || !groups) {
    return (
      <div className="summary-card">
        <span className="skel-bar tall" style={{ width: 180 }} />
        <div className="group-pills">
          {GROUPS.map((def) => (
            <span key={def.id} className="skel-bar tall" />
          ))}
        </div>
      </div>
    );
  }

  const faulty = GROUPS.filter(
    (def) => faultsOf(groups[def.id].applied).length > 0,
  );

  return (
    <div className="summary-card">
      <div className="summary-top">
        <span className="summary-count" data-fault={faulty.length > 0}>
          {faulty.length}
          <small> / {GROUPS.length} 그룹</small>
        </span>
        <span className="summary-label">
          {faulty.length > 0
            ? `장애가 걸려 있습니다: ${faulty.map((def) => def.name).join(", ")}`
            : "모든 그룹이 정상입니다."}
          {deviceOnCount > 0 &&
            ` 장비 값 주입 ${deviceOnCount}건이 켜져 있습니다.`}
        </span>
      </div>
      <div className="group-pills">
        {GROUPS.map((def) => {
          const list = faultsOf(groups[def.id].applied);
          return (
            <button
              key={def.id}
              type="button"
              className="gpill"
              data-fault={list.length > 0}
              onClick={() => onGoto(def.id)}
            >
              <span className="gpill-top">
                <span className="gpill-name">{def.name}</span>
                {list.length > 0 ? (
                  <span className="badge" data-tone="danger">
                    <Icon name="warn" />
                    장애 {list.length}
                  </span>
                ) : (
                  <span className="badge" data-tone="ok">
                    <Icon name="check" />
                    정상
                  </span>
                )}
              </span>
              <span className="gpill-desc od-clamp-2">
                {list.length > 0
                  ? list.join(" · ")
                  : `${def.protocol} · ${def.unit}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
