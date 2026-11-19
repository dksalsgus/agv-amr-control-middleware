import { percentile } from "../common/utils/format.util";
import { Alarm } from "../realtime/realtime.types";
import { FILTER_STATES, OP_LABEL, P95_WARN_MS } from "./monitor.constants";
import { MapRobot } from "./monitor.types";

type Props = {
  robots: MapRobot[];
  alarms: Alarm[];
  latencies: ReadonlyMap<string, number>;
  states: ReadonlySet<string>;
  onPick: (key: string) => void;
};

const countBy = (robots: MapRobot[]): Map<string, number> =>
  robots.reduce((counts, robot) => {
    counts.set(robot.opState, (counts.get(robot.opState) ?? 0) + 1);
    if (robot.stale) {
      counts.set("STALE", (counts.get("STALE") ?? 0) + 1);
    }
    return counts;
  }, new Map<string, number>());

/** 상태별 대수, 열린 알람, 종단 지연. 상태 칸을 누르면 맵 필터가 그 상태 하나로 바뀐다. */
export const SummaryBar = (props: Props) => {
  const counts = countBy(props.robots);
  const lats = props.robots
    .filter((robot) => !robot.stale && props.latencies.has(robot.id))
    .map((robot) => props.latencies.get(robot.id) ?? 0)
    .sort((a, b) => a - b);
  const p50 = Math.round(percentile(lats, 50));
  const p95 = Math.round(percentile(lats, 95));
  const unacked = props.alarms.filter((alarm) => !alarm.ackedAt).length;
  const hasCritical = props.alarms.some(
    (alarm) => !alarm.ackedAt && alarm.level === "CRITICAL",
  );
  const all = props.states.size === FILTER_STATES.length;
  const isOnly = (key: string) =>
    !all && props.states.size === 1 && props.states.has(key);

  return (
    <>
      <button
        type="button"
        className="stat"
        aria-pressed={all}
        onClick={() => props.onPick("ALL")}
      >
        <span className="stat-label">전체 로봇</span>
        <span className="stat-value">
          <span>{props.robots.length}</span>
          <small>대</small>
        </span>
      </button>
      <span className="stat-sep" aria-hidden="true" />
      {FILTER_STATES.map((key) => (
        <button
          key={key}
          type="button"
          className="stat"
          aria-pressed={isOnly(key)}
          data-alert={
            key === "ERROR" ? String((counts.get(key) ?? 0) > 0) : undefined
          }
          data-warn={
            key === "STALE" ? String((counts.get(key) ?? 0) > 0) : undefined
          }
          onClick={() => props.onPick(key)}
        >
          <span className="stat-label">
            <span
              className="dot"
              style={{ color: `var(--st-${key.toLowerCase()})` }}
            />
            {OP_LABEL[key]}
            {key === "STALE" ? " (STALE)" : ""}
          </span>
          <span className="stat-value">{counts.get(key) ?? 0}</span>
        </button>
      ))}
      <span className="stat-sep" aria-hidden="true" />
      <div className="stat" data-alert={String(hasCritical)}>
        <span className="stat-label">열린 알람</span>
        <span className="stat-value">
          <span>{props.alarms.length}</span>
          <small> · 미확인 {unacked}</small>
        </span>
      </div>
      <div className="stat">
        <span className="stat-label">종단 지연 p50</span>
        <span className="stat-value">
          <span>{p50}</span>
          <small>ms</small>
        </span>
      </div>
      <div className="stat" data-warn={String(p95 > P95_WARN_MS)}>
        <span className="stat-label">종단 지연 p95</span>
        <span className="stat-value">
          <span>{p95}</span>
          <small>ms</small>
        </span>
      </div>
    </>
  );
};
