import { formatNumber } from "../common/utils/number.util";
import { Icon } from "../components/icon";
import { TARGET_LABEL } from "./logs.constants";
import { LogTargetType } from "./logs.types";

type Props = {
  targetType: LogTargetType;
  name: string;
  total: number | null;
  onClear: () => void;
};

/** 대상 하나로 좁혀 볼 때만 나오는 띠 */
export const LogScope = ({ targetType, name, total, onClear }: Props) => (
  <div className="scope">
    <Icon name="filter" size={16} />
    <span className="scope-title" id="scopeTitle" tabIndex={-1}>
      {TARGET_LABEL[targetType]} <strong>{name}</strong>의 이력만 보는 중
      {total !== null && ` · ${formatNumber(total)}건`}
    </span>
    <button type="button" className="btn btn-sm" onClick={onClear}>
      <Icon name="back" />
      전체 이력으로
    </button>
  </div>
);
