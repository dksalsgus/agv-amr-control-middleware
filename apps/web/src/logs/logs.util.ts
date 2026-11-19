import { pad2 } from "../common/utils/format.util";
import { LogFilter, LogQuery, TargetOption } from "./logs.types";
import { Robot, PlcPoint } from "../realtime/realtime.types";
import { ConnectionItem } from "../connections/connections.types";

export const ALL_FILTER: LogFilter = {
  type: "ALL",
  targetType: "ALL",
  targetId: "ALL",
};

export const hasFilter = (filter: LogFilter): boolean =>
  filter.type !== "ALL" || filter.targetType !== "ALL";

/** GET /logs의 쿼리 문자열. "ALL"인 조건은 뺀다. */
export const toLogsPath = (query: LogQuery): string => {
  const params = new URLSearchParams();
  if (query.filter.type !== "ALL") {
    params.set("type", query.filter.type);
  }
  if (query.filter.targetType !== "ALL") {
    params.set("targetType", query.filter.targetType);
  }
  if (query.filter.targetId !== "ALL") {
    params.set("targetId", query.filter.targetId);
  }
  params.set("page", String(query.page));
  params.set("size", String(query.size));
  return `/logs?${params.toString()}`;
};

/** 첫·끝 쪽과 현재 쪽 앞뒤만 남기고 사이는 "gap"으로 접는다. */
export const pageList = (current: number, last: number): (number | "gap")[] => {
  const pages = Array.from(
    new Set([1, last, current - 1, current, current + 1]),
  )
    .filter((page) => page >= 1 && page <= last)
    .sort((a, b) => a - b);
  return pages.flatMap((page, index) =>
    index > 0 && page - pages[index - 1] > 1 ? ["gap" as const, page] : [page],
  );
};

export const connectionOptions = (
  connections: ConnectionItem[],
): TargetOption[] =>
  connections.map((connection) => ({
    id: connection.id,
    name: connection.name,
  }));

export const robotOptions = (
  robots: ReadonlyMap<string, Robot>,
): TargetOption[] =>
  Array.from(robots.values())
    .map((robot) => ({ id: robot.id, name: robot.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

export const plcPointOptions = (
  points: ReadonlyMap<string, PlcPoint>,
): TargetOption[] =>
  Array.from(points.values())
    .sort((a, b) => a.pointNo - b.pointNo)
    .map((point) => ({
      id: point.id,
      name: `점 ${pad2(point.pointNo)} · ${point.name}`,
    }));
