import { formatTime } from "../common/utils/format.util";
import { ConnectionPhase, ConnectionRow } from "./connections-view.types";
import { StatusBadge } from "./status-badge";

type Props = {
  rows: ConnectionRow[];
  selectedId: string | null;
  draftRow: { name: string; sub: string } | null;
  phases: ReadonlyMap<string, ConnectionPhase>;
  busyId: string | null;
  onPick: (id: string) => void;
  onToggle: (id: string) => void;
};

/** 왼쪽 연결 목록. 켬·끔 스위치는 바로 저장된다. */
export const ConnectionList = (props: Props) => {
  const up = props.rows.filter(
    (row) => row.status === "UP" && !props.phases.has(row.id),
  ).length;

  return (
    <section className="list-col" aria-labelledby="listTitle">
      <div className="list-head">
        <h2 className="panel-title" id="listTitle">
          연결 목록
        </h2>
        <span className="panel-meta mono">
          {props.rows.length}개 · UP {up}
        </span>
      </div>
      <ul className="conn-rows">
        {props.draftRow && (
          <li className="conn-row" data-draft="true" aria-current="true">
            <div className="conn-pick" style={{ cursor: "default" }}>
              <span className="conn-name od-truncate">
                {props.draftRow.name}
              </span>
              <span className="conn-sub">{props.draftRow.sub}</span>
            </div>
          </li>
        )}
        {props.rows.map((row) => {
          const phase = props.phases.get(row.id);
          return (
            <li
              key={row.id}
              className="conn-row"
              data-status={row.status}
              aria-current={!props.draftRow && row.id === props.selectedId}
            >
              <button
                type="button"
                className="conn-pick"
                aria-label={`${row.name} 편집 열기`}
                onClick={() => props.onPick(row.id)}
              >
                <span className="conn-name od-truncate">{row.name}</span>
                <span className="conn-sub od-truncate">
                  {row.vendorName} · {row.protocol}
                </span>
                <dl className="conn-meta">
                  <div>
                    <dt>장비</dt>
                    <dd>{row.deviceCount}대</dd>
                  </div>
                  <div>
                    <dt>상태 변경</dt>
                    <dd>
                      {row.changedAt
                        ? formatTime(Date.parse(row.changedAt))
                        : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt>version</dt>
                    <dd>v{row.version}</dd>
                  </div>
                </dl>
              </button>
              <div className="conn-side">
                <StatusBadge status={row.status} phase={phase} />
                <span className="switch-wrap">
                  <span aria-hidden="true">{row.enabled ? "켬" : "끔"}</span>
                  <button
                    type="button"
                    className="switch"
                    role="switch"
                    aria-checked={row.enabled}
                    aria-label={`${row.name} enabled`}
                    disabled={phase !== undefined || props.busyId === row.id}
                    onClick={() => props.onToggle(row.id)}
                  />
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
