import { formatTime } from "../common/utils/format.util";
import { Icon, IconName } from "../components/icon";
import { ConnectionItem } from "../connections/connections.types";
import { Link } from "../realtime/realtime.types";

type Props = {
  connections: ConnectionItem[];
  links: ReadonlyMap<string, Link>;
};

const LINK_ICON: Record<string, IconName> = {
  UP: "check",
  DOWN: "x",
  UNKNOWN: "question",
};

/** 꺼진 연결은 수집하지 않아 UP·DOWN이 없다. 정상처럼 보이지 않게 따로 표시한다. */
const OFF_LABEL = "꺼짐";

/** 연결 목록은 REST로 한 번 받고, UP·DOWN과 바뀐 시각은 실시간 값으로 덮는다. */
export const ConnectionPanel = ({ connections, links }: Props) => {
  const rows = connections.map((connection) => {
    const link = links.get(connection.id);
    const changedAt = link ? link.changedAt : connection.linkChangedAt;
    return {
      connection,
      status: connection.enabled
        ? (link?.status ?? connection.linkStatus)
        : OFF_LABEL,
      changedAt: changedAt ? Date.parse(changedAt) : null,
    };
  });
  const up = rows.filter((row) => row.status === "UP").length;

  return (
    <section className="panel" aria-labelledby="connTitle">
      <div className="panel-head">
        <h2 className="panel-title" id="connTitle">
          연결 상태
        </h2>
        <span className="panel-meta end">
          UP {up} / {rows.length}
        </span>
      </div>
      <div className="skel">
        <i className="tall" />
        <i className="tall" />
        <i className="tall" />
        <i className="tall" />
      </div>
      <ul className="conn-list data-only">
        {rows.map(({ connection, status, changedAt }) => (
          <li key={connection.id} className="conn-item" data-status={status}>
            <div className="od-row">
              <div className="od-field od-fill">
                <span className="conn-name od-truncate">{connection.name}</span>
                <span className="conn-sub od-truncate">
                  {connection.vendorName} · {connection.protocol}
                </span>
              </div>
              <span
                className="badge link-badge od-fixed"
                data-status={status === OFF_LABEL ? "UNKNOWN" : status}
              >
                <Icon name={LINK_ICON[status] ?? "x"} />
                {status}
              </span>
            </div>
            <dl className="conn-meta">
              <div>
                <dt>변경</dt>
                <dd>{changedAt === null ? "-" : formatTime(changedAt)}</dd>
              </div>
              <div>
                <dt>장비</dt>
                <dd>{connection.deviceCount}</dd>
              </div>
              <div>
                <dt>사용</dt>
                <dd>{connection.enabled ? "enabled" : "disabled"}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
};
