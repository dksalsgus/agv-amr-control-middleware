import {
  RouteLane,
  RouteNode,
  RouteNodeKind,
  RouteSearchStep,
} from "./route-map.types";

/** 바닥에 그려진 통로망. 왼쪽 열은 충전소, 오른쪽 열은 적재장, 나머지는 작업대다. 단위 m */
export class RouteMap {
  static readonly NODES: RouteNode[] = [
    { id: "CHG-1", x: 5, y: 5, kind: "CHARGER" },
    { id: "WS-1", x: 15, y: 5, kind: "STATION" },
    { id: "WS-2", x: 25, y: 5, kind: "STATION" },
    { id: "WS-3", x: 35, y: 5, kind: "STATION" },
    { id: "STO-1", x: 45, y: 5, kind: "STORAGE" },
    { id: "CHG-2", x: 5, y: 15, kind: "CHARGER" },
    { id: "WS-4", x: 15, y: 15, kind: "STATION" },
    { id: "WS-5", x: 25, y: 15, kind: "STATION" },
    { id: "WS-6", x: 35, y: 15, kind: "STATION" },
    { id: "STO-2", x: 45, y: 15, kind: "STORAGE" },
    { id: "CHG-3", x: 5, y: 25, kind: "CHARGER" },
    { id: "WS-7", x: 15, y: 25, kind: "STATION" },
    { id: "WS-8", x: 25, y: 25, kind: "STATION" },
    { id: "WS-9", x: 35, y: 25, kind: "STATION" },
    { id: "STO-3", x: 45, y: 25, kind: "STORAGE" },
  ];

  /** 가로 통로는 세 줄 모두, 세로 통로는 x = 5, 25, 45에만 있다. */
  static readonly LANES: RouteLane[] = [
    ["CHG-1", "WS-1"],
    ["WS-1", "WS-2"],
    ["WS-2", "WS-3"],
    ["WS-3", "STO-1"],
    ["CHG-2", "WS-4"],
    ["WS-4", "WS-5"],
    ["WS-5", "WS-6"],
    ["WS-6", "STO-2"],
    ["CHG-3", "WS-7"],
    ["WS-7", "WS-8"],
    ["WS-8", "WS-9"],
    ["WS-9", "STO-3"],
    ["CHG-1", "CHG-2"],
    ["CHG-2", "CHG-3"],
    ["WS-2", "WS-5"],
    ["WS-5", "WS-8"],
    ["STO-1", "STO-2"],
    ["STO-2", "STO-3"],
  ];

  randomNode(kind?: RouteNodeKind) {
    const candidates = RouteMap.NODES.filter(
      (node) => kind === undefined || node.kind === kind,
    );

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  /** from에서 to까지 거치는 지점 목록(from 제외, to 포함). 지점 수가 가장 적은 경로다. */
  findPath(from: RouteNode, to: RouteNode) {
    const visited = new Set<string>([from.id]);
    const queue: RouteSearchStep[] = [{ node: from, path: [] }];

    while (queue.length > 0) {
      const step = queue.shift() as RouteSearchStep;
      if (step.node.id === to.id) {
        return step.path;
      }

      for (const neighbor of this.neighbors(step.node)) {
        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          queue.push({ node: neighbor, path: step.path.concat(neighbor) });
        }
      }
    }

    return [];
  }

  nearestCharger(from: RouteNode) {
    const candidates = RouteMap.NODES.filter(
      (node) => node.kind === "CHARGER",
    ).map((charger) => ({
      charger,
      hops: this.findPath(from, charger).length,
    }));

    const nearest = candidates.reduce((best, candidate) =>
      candidate.hops < best.hops ? candidate : best,
    );

    return nearest.charger;
  }

  private neighbors(node: RouteNode) {
    return RouteMap.LANES.filter((lane) => lane.includes(node.id)).map((lane) =>
      this.nodeById(lane[0] === node.id ? lane[1] : lane[0]),
    );
  }

  private nodeById(id: string) {
    return RouteMap.NODES.find((node) => node.id === id) as RouteNode;
  }
}
