import { Icon, IconName } from "../components/icon";
import { ConnectionPhase } from "./connections-view.types";

const STATUS_ICON: Record<string, IconName> = {
  UP: "check",
  DOWN: "x",
  UNKNOWN: "question",
};

const PHASE_TEXT: Record<ConnectionPhase, string> = {
  saving: "저장 중",
  reconnecting: "재연결 중",
  stopping: "내리는 중",
};

type Props = { status: string; phase?: ConnectionPhase };

/** 연결 상태 배지. 저장·재연결 중이면 진행 표시로 바뀐다. */
export const StatusBadge = ({ status, phase }: Props) => {
  if (phase) {
    return (
      <span className="badge status-badge" data-status="BUSY">
        <span className="spin" aria-hidden="true" />
        {PHASE_TEXT[phase]}
      </span>
    );
  }
  return (
    <span className="badge status-badge" data-status={status}>
      <Icon name={STATUS_ICON[status] ?? "question"} />
      {status}
    </span>
  );
};
