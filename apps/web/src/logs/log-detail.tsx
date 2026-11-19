import {
  formatDateTimeMs,
  formatMonthDayTime,
} from "../common/utils/format.util";
import { Icon } from "../components/icon";
import { ALARM_LABEL } from "../monitor/monitor.constants";
import { SevTag, TypeTag } from "./log-tags";
import { LOG_LABEL, TARGET_LABEL } from "./logs.constants";
import { LogFilter, LogItem } from "./logs.types";

type Props = {
  log: LogItem | null;
  recent: LogItem[];
  filter: LogFilter;
  nameOf: (id: string) => string;
  onSelect: (log: LogItem) => void;
  onScope: (log: LogItem) => void;
  onClear: () => void;
};

export const LogDetail = ({
  log,
  recent,
  filter,
  nameOf,
  onSelect,
  onScope,
  onClear,
}: Props) => {
  if (!log) {
    return (
      <div className="detail-body">
        <div className="empty">
          <strong>고른 기록이 없습니다</strong>
          <span>
            표에서 행을 고르면 상세 내용과 같은 대상의 최근 이력이 여기에
            나옵니다.
          </span>
        </div>
      </div>
    );
  }

  const name = nameOf(log.targetId);
  const scoped =
    filter.targetType === log.targetType && filter.targetId === log.targetId;

  return (
    <div className="detail-body">
      <div className="detail-title">
        <TypeTag type={log.type} />
        <SevTag level={log.level} />
      </div>
      <dl className="kv">
        <div className="span-2">
          <dt>발생 시각</dt>
          <dd className="mono">
            {formatDateTimeMs(Date.parse(log.createdAt))}
          </dd>
        </div>
        <div>
          <dt>유형</dt>
          <dd className="mono">{log.type}</dd>
        </div>
        <div>
          <dt>등급</dt>
          <dd className="mono">{log.level}</dd>
        </div>
        <div className="span-2">
          <dt>알람 코드</dt>
          <dd>
            {log.alarmCode ? (
              <>
                <span className="mono">{log.alarmCode}</span> ·{" "}
                {ALARM_LABEL[log.alarmCode]}
              </>
            ) : (
              "해당 없음 (연결 로그)"
            )}
          </dd>
        </div>
        <div>
          <dt>대상 유형</dt>
          <dd>
            {TARGET_LABEL[log.targetType]}{" "}
            <span className="mono faint">{log.targetType}</span>
          </dd>
        </div>
        <div>
          <dt>대상 이름</dt>
          <dd className="mono">{name}</dd>
        </div>
        <div className="span-2">
          <dt>메시지</dt>
          <dd>{log.message}</dd>
        </div>
        <div className="span-2">
          <dt>로그 ID</dt>
          <dd className="mono">#{log.id}</dd>
        </div>
      </dl>
      <div className="detail-actions">
        {scoped ? (
          <button type="button" className="btn" onClick={onClear}>
            <Icon name="back" />
            전체 이력으로 돌아가기
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onScope(log)}
          >
            <Icon name="filter" />이 대상의 이력만 보기
          </button>
        )}
      </div>
      <section className="recent" aria-labelledby="recentTitle">
        <h3 className="recent-title" id="recentTitle">
          {name}의 최근 이력
        </h3>
        <div className="recent-list">
          {recent.map((item) => (
            <button
              key={item.id}
              type="button"
              className="recent-item"
              aria-current={item.id === log.id}
              onClick={() => onSelect(item)}
            >
              <span className="ts">
                {formatMonthDayTime(Date.parse(item.createdAt))}
              </span>
              <span className="t">{LOG_LABEL[item.type]}</span>
              <span className="m od-truncate">{item.message}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
