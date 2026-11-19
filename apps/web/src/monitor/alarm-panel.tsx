import { formatTime, pad2 } from "../common/utils/format.util";
import { Icon, IconName } from "../components/icon";
import { Alarm, PlcPoint } from "../realtime/realtime.types";
import { ALARM_LABEL, SEV_RANK } from "./monitor.constants";
import { MapRobot } from "./monitor.types";

type Props = {
  alarms: Alarm[];
  robots: ReadonlyMap<string, MapRobot>;
  plcPoints: ReadonlyMap<string, PlcPoint>;
  connectionNames: ReadonlyMap<string, string>;
  canAck: boolean;
  showOfflineNote: boolean;
  onAck: (id: string) => void;
  onGotoRobot: (id: string) => void;
  onGotoPlc: (id: string) => void;
};

const SEV_ICON: Record<string, IconName> = {
  INFO: "info",
  WARN: "warn",
  CRITICAL: "critical",
};

/** 미확인 먼저, 그다음 심각도 높은 순, 같으면 최근 순 */
const sortAlarms = (alarms: Alarm[]): Alarm[] =>
  alarms
    .slice()
    .sort(
      (a, b) =>
        Number(a.ackedAt !== null) - Number(b.ackedAt !== null) ||
        (SEV_RANK[b.level] ?? 0) - (SEV_RANK[a.level] ?? 0) ||
        Date.parse(b.raisedAt) - Date.parse(a.raisedAt),
    );

type TargetProps = Pick<
  Props,
  "robots" | "plcPoints" | "connectionNames" | "onGotoRobot" | "onGotoPlc"
> & { alarm: Alarm };

const AlarmTarget = (props: TargetProps) => {
  const { alarm } = props;
  if (alarm.targetType === "PLC_POINT") {
    const point = props.plcPoints.get(alarm.targetId);
    const label = point
      ? `${point.name} (점 ${pad2(point.pointNo)})`
      : alarm.targetId;
    return (
      <button
        type="button"
        className="alarm-target"
        onClick={() => props.onGotoPlc(alarm.targetId)}
      >
        {label}
      </button>
    );
  }
  const robot = props.robots.get(alarm.targetId);
  if (alarm.targetType === "DEVICE" && robot) {
    return (
      <button
        type="button"
        className="alarm-target"
        onClick={() => props.onGotoRobot(alarm.targetId)}
      >
        {robot.name}
      </button>
    );
  }
  const name = props.connectionNames.get(alarm.targetId) ?? alarm.targetId;
  return <span className="alarm-target">{name}</span>;
};

/** 열린 알람 목록과 확인(ack). 서버 연결이 끊긴 동안에는 확인할 수 없다. */
export const AlarmPanel = (props: Props) => {
  const unacked = props.alarms.filter((alarm) => alarm.ackedAt === null).length;

  return (
    <section
      className="panel"
      aria-labelledby="alarmTitle"
      style={{
        display: "grid",
        gridTemplateRows: "auto auto minmax(0,1fr)",
        minHeight: 0,
        paddingBottom: 0,
      }}
    >
      <div className="panel-head">
        <h2 className="panel-title" id="alarmTitle" tabIndex={-1}>
          열린 알람
        </h2>
        <span className="badge end" data-tone="danger" hidden={unacked === 0}>
          미확인 {unacked}
        </span>
      </div>
      <div>
        {props.showOfflineNote && (
          <p className="perm-note">
            <Icon name="unplug" />
            서버 연결이 복구되면 알람을 확인할 수 있습니다.
          </p>
        )}
      </div>
      <div className="col-scroll" style={{ paddingBottom: "var(--sp-4)" }}>
        <div className="skel">
          <i className="tall" />
          <i className="tall" />
          <i className="tall" />
        </div>
        <ul className="alarm-list data-only" aria-labelledby="alarmTitle">
          {props.alarms.length === 0 && (
            <li className="empty">
              <strong>열린 알람이 없습니다</strong>
              <span>새 알람이 생기면 여기에 바로 표시됩니다.</span>
            </li>
          )}
          {sortAlarms(props.alarms).map((alarm) => (
            <li
              key={alarm.id}
              className="alarm"
              data-sev={alarm.level}
              data-acked={String(alarm.ackedAt !== null)}
              tabIndex={-1}
            >
              <div className="alarm-head">
                <span className="sev" data-sev={alarm.level}>
                  <Icon name={SEV_ICON[alarm.level] ?? "info"} />
                  {alarm.level}
                </span>
                <span className="alarm-type">
                  {ALARM_LABEL[alarm.code] ?? alarm.code}
                </span>
                <time className="alarm-time" dateTime={alarm.raisedAt}>
                  {formatTime(Date.parse(alarm.raisedAt))}
                </time>
              </div>
              <AlarmTarget
                alarm={alarm}
                robots={props.robots}
                plcPoints={props.plcPoints}
                connectionNames={props.connectionNames}
                onGotoRobot={props.onGotoRobot}
                onGotoPlc={props.onGotoPlc}
              />
              <p className="alarm-msg">{alarm.message}</p>
              <div className="alarm-foot">
                {alarm.ackedAt === null ? (
                  <>
                    <span className="ack-state">미확인</span>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={!props.canAck}
                      onClick={() => props.onAck(alarm.id)}
                    >
                      확인
                    </button>
                  </>
                ) : (
                  <span className="ack-state is-acked">
                    <Icon name="check" /> 확인됨 ·{" "}
                    {formatTime(Date.parse(alarm.ackedAt))}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
