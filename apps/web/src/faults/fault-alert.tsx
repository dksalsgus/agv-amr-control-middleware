import { Icon } from "../components/icon";
import { RequestFailure } from "./faults.types";

type Props = { failure: RequestFailure; onRetry: () => void };

/** 에뮬레이터 요청이 실패하면 화면 위에 뜨는 띠 */
export const FaultAlert = ({ failure, onRetry }: Props) => (
  <div className="alert-bar" role="alert">
    <Icon name="unplug" size={16} />
    <span>
      <strong>에뮬레이터에 연결할 수 없습니다</strong> ·{" "}
      <span className="mono">
        {failure.method} {failure.path}
      </span>{" "}
      → {failure.reason}. 화면의 입력값은 그대로 남아 있습니다.
    </span>
    <button type="button" className="btn btn-sm" onClick={onRetry}>
      <Icon name="refresh" />
      다시 시도
    </button>
  </div>
);
