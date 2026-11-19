import { useEffect, useMemo, useState } from "react";
import { alarmsApi } from "../alarms/alarms.api";
import { useNow } from "../common/hooks/use-now";
import { toggleInSet } from "../common/utils/set.util";
import { Gnb, LivePill } from "../components/gnb";
import { ToastList } from "../components/toast-list";
import { useToasts } from "../components/use-toasts";
import { connectionsApi } from "../connections/connections.api";
import { ConnectionItem } from "../connections/connections.types";
import { AlarmPanel } from "../monitor/alarm-panel";
import { ConnBanner } from "../monitor/conn-banner";
import { ConnectionPanel } from "../monitor/connection-panel";
import { FILTER_STATES, VENDOR_KEYS } from "../monitor/monitor.constants";
import { MapLegend } from "../monitor/map-legend";
import { MapToolbar } from "../monitor/map-toolbar";
import { MonitorMode, VendorKey } from "../monitor/monitor.types";
import {
  downLinks,
  isVisible,
  toMapRobots,
  toMonitorMode,
  toVendorKeys,
} from "../monitor/monitor.util";
import { PlcPanel } from "../monitor/plc-panel";
import { RobotDetail } from "../monitor/robot-detail";
import { RobotMap } from "../monitor/robot-map";
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

/** 관제 화면 */
export const MonitorPage = () => {
  const view = useRealtime();
  const { toasts, push } = useToasts();
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [selectedPlcId, setSelectedPlcId] = useState<string | null>(null);
  const [selectedRobotId, setSelectedRobotId] = useState<string | null>(null);
  const [vendors, setVendors] = useState<ReadonlySet<VendorKey>>(
    () => new Set(VENDOR_KEYS),
  );
  const [states, setStates] = useState<ReadonlySet<string>>(
    () => new Set(FILTER_STATES),
  );
  const filters = useMemo(() => ({ vendors, states }), [vendors, states]);

  useEffect(() => {
    connectionsApi
      .findAll()
      .then(setConnections)
      .catch((error: unknown) => console.warn("연결 목록 조회 실패", error));
  }, []);

  const now = useNow(1000);
  const mode = toMonitorMode(view);
  useMonitorToasts(mode, push);

  const vendorKeys = useMemo(() => toVendorKeys(connections), [connections]);
  const robots = useMemo(
    () => toMapRobots(view.robots, vendorKeys),
    [view.robots, vendorKeys],
  );
  const plcPoints = useMemo(
    () =>
      Array.from(view.plcPoints.values()).sort((a, b) => a.pointNo - b.pointNo),
    [view.plcPoints],
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

  const robotsById = useMemo(
    () => new Map(robots.map((robot) => [robot.id, robot])),
    [robots],
  );
  const connectionNames = useMemo(
    () =>
      new Map(
        connections.map((connection) => [connection.id, connection.name]),
      ),
    [connections],
  );
  const selectedRobot = selectedRobotId
    ? robotsById.get(selectedRobotId)
    : undefined;
  const selectedConnection = connections.find(
    (connection) => connection.id === selectedRobot?.connectionId,
  );

  const pickSummary = (key: string) =>
    setStates(new Set(key === "ALL" ? FILTER_STATES : [key]));

  const resetFilters = () => {
    setVendors(new Set(VENDOR_KEYS));
    setStates(new Set(FILTER_STATES));
  };

  const toggleVendor = (vendor: VendorKey) =>
    setVendors((current) => toggleInSet(current, vendor));

  const toggleState = (state: string) =>
    setStates((current) => toggleInSet(current, state));

  /** 필터에 가려진 로봇을 고르면 필터를 풀어 보이게 한다. */
  const revealRobot = (id: string) => {
    const robot = robots.find((item) => item.id === id);
    if (robot && !isVisible(robot, filters)) {
      resetFilters();
    }
    setSelectedRobotId(id);
  };

  const findRobot = (query: string) => {
    const keyword = query.trim().toUpperCase();
    const robot =
      robots.find((item) => item.name.toUpperCase() === keyword) ??
      robots.find((item) => item.name.toUpperCase().includes(keyword));
    if (!robot) {
      push(`‘${query}’에 해당하는 로봇이 없습니다.`, "warn");
      return;
    }
    revealRobot(robot.id);
  };

  const ackAlarm = async (id: string) => {
    try {
      await alarmsApi.ack(id);
    } catch (error) {
      console.warn("알람 확인 실패", error);
      push(
        "알람을 확인하지 못했습니다. 이미 해제된 알람일 수 있습니다.",
        "warn",
      );
    }
  };

  const streaming = mode === "live" || mode === "linkDown";
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
    <div className="app" data-page="monitor" data-mode={mode}>
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
        <div
          className="col col-left"
          style={{ gridTemplateRows: "minmax(0, 1fr)" }}
        >
          <div className="col-scroll">
            <ConnectionPanel connections={connections} links={view.links} />
            <PlcPanel
              points={plcPoints}
              selectedId={selectedPlcId}
              onSelect={setSelectedPlcId}
            />
          </div>
        </div>
        <div className="col col-center">
          <MapToolbar
            robots={robots}
            filters={filters}
            onToggleVendor={toggleVendor}
            onToggleState={toggleState}
            onReset={resetFilters}
            onFind={findRobot}
          />
          <RobotMap
            robots={robots}
            plcPoints={plcPoints}
            filters={filters}
            selectedId={selectedRobotId}
            waiting={mode === "connecting"}
            frozenAt={frozen ? view.disconnectedAt : null}
            onSelect={setSelectedRobotId}
          />
          <MapLegend
            visible={robots.filter((robot) => isVisible(robot, filters)).length}
            total={robots.length}
          />
        </div>
        <div className="col col-right">
          <section className="panel" aria-labelledby="detailTitle">
            <div className="panel-head">
              <h2 className="panel-title" id="detailTitle">
                선택한 로봇
              </h2>
              <span className="panel-meta end mono">
                {selectedRobot ? `seq ${selectedRobot.seq}` : ""}
              </span>
            </div>
            <div className="skel">
              <i className="tall" />
              <i />
              <i className="short" />
              <i />
              <i className="short" />
              <i />
            </div>
            <div className="data-only">
              <RobotDetail
                robot={selectedRobot}
                connectionName={selectedConnection?.name ?? ""}
                vendorName={selectedConnection?.vendorName ?? ""}
                latency={view.latencies.get(selectedRobotId ?? "")}
                now={now}
              />
            </div>
          </section>
          <AlarmPanel
            alarms={alarms}
            robots={robotsById}
            plcPoints={view.plcPoints}
            connectionNames={connectionNames}
            canAck={streaming}
            showOfflineNote={!streaming && mode !== "connecting"}
            onAck={(id) => void ackAlarm(id)}
            onGotoRobot={revealRobot}
            onGotoPlc={setSelectedPlcId}
          />
        </div>
      </main>
      <ToastList toasts={toasts} />
    </div>
  );
};
