import { ConnectionItem } from "../connections/connections.types";
import {
  Link,
  PlcPoint,
  RealtimeView,
  Robot,
} from "../realtime/realtime.types";
import {
  PLC_POSITIONS,
  PLC_TAG,
  VENDOR_KEY_BY_CODE,
} from "./monitor.constants";
import { MapFilters, MapRobot, MonitorMode, VendorKey } from "./monitor.types";

/** 접속 전 첫 스냅샷 대기, 끊김, 재접속 중, 현장 연결 DOWN을 구분한다. */
export const toMonitorMode = (view: RealtimeView): MonitorMode => {
  if (view.status === "OPEN") {
    const hasDownLink = Array.from(view.links.values()).some(
      (link) => link.status === "DOWN",
    );
    return hasDownLink ? "linkDown" : "live";
  }
  if (view.epoch === null) {
    return "connecting";
  }
  return view.status === "DISCONNECTED" ? "disconnected" : "reconnecting";
};

export const toVendorKeys = (
  connections: ConnectionItem[],
): Map<string, VendorKey> =>
  new Map(
    connections
      .filter((connection) => VENDOR_KEY_BY_CODE[connection.vendorCode])
      .map((connection) => [
        connection.id,
        VENDOR_KEY_BY_CODE[connection.vendorCode],
      ]),
  );

/** 아직 한 번도 받지 못한 로봇(state가 없음)은 위치를 몰라 맵에서 뺀다. */
export const toMapRobots = (
  robots: ReadonlyMap<string, Robot>,
  vendorKeys: ReadonlyMap<string, VendorKey>,
): MapRobot[] =>
  Array.from(robots.values()).flatMap((robot) => {
    if (!robot.state) {
      return [];
    }
    return [
      {
        id: robot.id,
        name: robot.name,
        vendor: vendorKeys.get(robot.connectionId) ?? "A",
        connectionId: robot.connectionId,
        type: robot.type,
        x: robot.state.x,
        y: robot.state.y,
        theta: robot.state.theta,
        speed: robot.state.speed,
        batteryPct: robot.state.batteryPct,
        opState: robot.state.opState,
        errorCode: robot.state.errorCode,
        loaded: robot.state.loaded,
        seq: robot.state.seq,
        sourceTs: robot.state.sourceTs,
        receivedTs: robot.state.receivedTs,
        stale: robot.stale,
      },
    ];
  });

export const filterKey = (robot: MapRobot): string =>
  robot.stale ? "STALE" : robot.opState;

export const isVisible = (robot: MapRobot, filters: MapFilters): boolean =>
  filters.vendors.has(robot.vendor) && filters.states.has(filterKey(robot));

export const downLinks = (links: ReadonlyMap<string, Link>): Link[] =>
  Array.from(links.values()).filter((link) => link.status === "DOWN");

/** 맵에 그리는 PLC 점의 이름표(D1, X2…). 맵 위치가 없는 점은 빠진다. */
export const toPlcMapTags = (points: PlcPoint[]): Map<string, string> => {
  const tags = new Map<string, string>();
  const counters = new Map<string, number>();
  for (const point of points) {
    const tag = PLC_TAG[point.type];
    if (!PLC_POSITIONS[point.pointNo] || !tag) {
      continue;
    }
    const order = (counters.get(point.type) ?? 0) + 1;
    counters.set(point.type, order);
    tags.set(point.id, `${tag}${order}`);
  }
  return tags;
};
