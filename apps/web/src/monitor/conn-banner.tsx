import { formatAgo, formatTime } from "../common/utils/format.util";
import { useNow } from "../common/hooks/use-now";
import { Icon } from "../components/icon";
import { ConnectionItem } from "../connections/connections.types";
import { realtimeClient } from "../realtime/realtime-client";
import { Link } from "../realtime/realtime.types";
import { MonitorMode } from "./monitor.types";

type Props = {
  mode: MonitorMode;
  disconnectedAt: number | null;
  downLinks: Link[];
  connections: ConnectionItem[];
  robotCountByConnection: ReadonlyMap<string, number>;
};

/** 서버 연결 상태 띠. 실시간 수신 중에는 숨긴다. */
export const ConnBanner = (props: Props) => {
  const now = useNow(1000);
  const lastAt = props.disconnectedAt ?? now;

  if (props.mode === "live") {
    return <div className="conn-banner" hidden />;
  }

  if (props.mode === "connecting") {
    return (
      <div className="conn-banner" data-tone="info" role="status">
        <Icon name="info" size={16} />
        <span>
          <strong>서버에 접속 중</strong> — 첫 스냅샷을 기다리고 있습니다.
        </span>
      </div>
    );
  }

  if (props.mode === "disconnected") {
    return (
      <div className="conn-banner" data-tone="danger" role="alert">
        <Icon name="unplug" size={16} />
        <span>
          <strong>서버 연결 끊김</strong> · 마지막 수신{" "}
          <span className="mono">{formatTime(lastAt)}</span> (
          <span className="mono">{formatAgo(now - lastAt)}</span>). 화면은
          마지막 상태를 흐리게 보여 주며 갱신되지 않습니다.
        </span>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => realtimeClient.reconnectNow()}
        >
          지금 재접속
        </button>
      </div>
    );
  }

  if (props.mode === "reconnecting") {
    return (
      <div className="conn-banner" data-tone="warn" role="status">
        <Icon name="warn" size={16} />
        <span>
          <strong>재접속 중</strong> · 마지막 수신{" "}
          <span className="mono">{formatTime(lastAt)}</span> ·{" "}
          <span>곧 다시 연결합니다</span>
        </span>
      </div>
    );
  }

  const link = props.downLinks[0];
  const connection = props.connections.find(
    (item) => item.id === link?.connectionId,
  );
  const changedAt = link?.changedAt ? Date.parse(link.changedAt) : now;
  const robotCount =
    props.robotCountByConnection.get(link?.connectionId ?? "") ?? 0;
  return (
    <div className="conn-banner" data-tone="warn" role="alert">
      <Icon name="unplug" size={16} />
      <span>
        <strong>{connection?.name ?? link?.connectionId} 연결 DOWN</strong> ·{" "}
        <span className="mono">{formatTime(changedAt)}</span>부터 · 소속 로봇{" "}
        {robotCount}대가 마지막 위치에 STALE로 표시됩니다.
      </span>
    </div>
  );
};
