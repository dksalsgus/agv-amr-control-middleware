import { useEffect, useMemo, useState } from "react";
import { Gnb, LivePill } from "../components/gnb";
import { ToastList } from "../components/toast-list";
import { useToasts } from "../components/use-toasts";
import { connectionsApi } from "../connections/connections.api";
import { ConnectionItem } from "../connections/connections.types";
import { ConnBanner } from "../monitor/conn-banner";
import { FILTER_STATES } from "../monitor/monitor.constants";
import { MonitorMode } from "../monitor/monitor.types";
import {
  downLinks,
  toMapRobots,
  toMonitorMode,
  toVendorKeys,
} from "../monitor/monitor.util";
import { SummaryBar } from "../monitor/summary-bar";
import { useMonitorToasts } from "../monitor/use-monitor-toasts";
import { useRealtime } from "../realtime/use-realtime";
import "../styles/monitor.css";

const LIVE_PILL: Record<MonitorMode, LivePill> = {
  connecting: { tone: "info", text: "접속 중", pulse: false },
  live: { tone: "ok", text: "실시간 수신", pulse: true },
  disconnected: { tone: "danger", text: "서버 연결 끊김", pulse: false },
  reconnecting: { tone: "warn", text: "재접속 중", pulse: false },
  linkDown: { tone: "warn", text: "실시간 수신 · 연결 DOWN", pulse: true },
};

/** 관제 화면. 디자인 기준은 docs/design/monitor.html */
export const MonitorPage = () => {
  const view = useRealtime();
  const { toasts, push } = useToasts();
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [states, setStates] = useState<ReadonlySet<string>>(
    () => new Set(FILTER_STATES),
  );

  useEffect(() => {
    connectionsApi
      .findAll()
      .then(setConnections)
      .catch((error: unknown) => console.warn("연결 목록 조회 실패", error));
  }, []);

  const mode = toMonitorMode(view);
  useMonitorToasts(mode, push);

  const vendorKeys = useMemo(() => toVendorKeys(connections), [connections]);
  const robots = useMemo(
    () => toMapRobots(view.robots, vendorKeys),
    [view.robots, vendorKeys],
  );
  const alarms = useMemo(() => Array.from(view.alarms.values()), [view.alarms]);
  const robotCountByConnection = useMemo(
    () =>
      robots.reduce(
        (counts, robot) =>
          counts.set(
            robot.connectionId,
            (counts.get(robot.connectionId) ?? 0) + 1,
          ),
        new Map<string, number>(),
      ),
    [robots],
  );

  const pickSummary = (key: string) =>
    setStates(new Set(key === "ALL" ? FILTER_STATES : [key]));

  const frozen = mode === "disconnected" || mode === "reconnecting";
  const pill =
    mode === "linkDown"
      ? {
          tone: LIVE_PILL.linkDown.tone,
          text: `실시간 수신 · 연결 ${downLinks(view.links).length}개 DOWN`,
          pulse: true,
        }
      : LIVE_PILL[mode];

  return (
    <div className="app" data-mode={mode}>
      <Gnb live={pill} />
      <ConnBanner
        mode={mode}
        disconnectedAt={view.disconnectedAt}
        downLinks={downLinks(view.links)}
        connections={connections}
        robotCountByConnection={robotCountByConnection}
      />
      <section className="summary" aria-label="상단 요약">
        <div
          className="skel"
          style={{
            gridAutoFlow: "column",
            gridAutoColumns: "88px",
            width: "100%",
          }}
        >
          <i className="tall" />
          <i className="tall" />
          <i className="tall" />
          <i className="tall" />
          <i className="tall" />
          <i className="tall" />
          <i className="tall" />
        </div>
        <div className="data-only" style={{ display: "contents" }}>
          <SummaryBar
            robots={robots}
            alarms={alarms}
            latencies={view.latencies}
            states={states}
            onPick={pickSummary}
          />
        </div>
      </section>
      <main className={frozen ? "workspace is-frozen" : "workspace"}>
        <div className="col col-left" />
        <div className="col col-center" />
        <div className="col col-right" />
      </main>
      <ToastList toasts={toasts} />
    </div>
  );
};
