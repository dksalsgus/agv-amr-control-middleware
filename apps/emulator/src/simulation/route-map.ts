import {
  RouteLane,
  RouteNode,
  RouteNodeKind,
  RouteSearchStep,
} from "./route-map.types";

/**
 * 관제 웹 맵에 점선으로 그린 통로망과 같은 좌표다. 단위 m
 * 통로 교차점 중 출하장 쪽 맨 위 줄은 작업대(STATION), 나머지는 랙 앞 적재 지점(STORAGE)이다.
 * 충전기는 맨 아래 가로 통로 바로 밑에 있고, 통로에서 짧은 진입로로 들어간다.
 */
export class RouteMap {
  private static readonly AISLE_X = [3, 12, 21, 30, 39, 47];
  private static readonly AISLE_Y = [3, 10, 17, 24, 27.5];
  private static readonly SHIPPING_Y = 27.5;
  private static readonly CHARGER_Y = 1.1;
  private static readonly CHARGER_X = Array.from(
    { length: 8 },
    (_, k) => Math.round((33 + k * 1.6) * 10) / 10,
  );

  static readonly NODES: RouteNode[] = RouteMap.buildNodes();
  static readonly LANES: RouteLane[] = RouteMap.buildLanes();

  private static buildNodes() {
    const crossings = RouteMap.AISLE_Y.flatMap((y) =>
      RouteMap.rowX(y).map((x) => ({
        id: RouteMap.crossingId(x, y),
        x,
        y,
        kind: RouteMap.crossingKind(x, y),
      })),
    );
    const chargers = RouteMap.CHARGER_X.map((x, k) => ({
      id: RouteMap.chargerId(k),
      x,
      y: RouteMap.CHARGER_Y,
      kind: "CHARGER" as const,
    }));

    return crossings.concat(chargers);
  }

  private static buildLanes() {
    const rows = RouteMap.AISLE_Y.flatMap((y) =>
      RouteMap.consecutivePairs(RouteMap.rowX(y)).map(
        ([a, b]): RouteLane => [
          RouteMap.crossingId(a, y),
          RouteMap.crossingId(b, y),
        ],
      ),
    );
    const columns = RouteMap.AISLE_X.flatMap((x) =>
      RouteMap.consecutivePairs(RouteMap.AISLE_Y).map(
        ([a, b]): RouteLane => [
          RouteMap.crossingId(x, a),
          RouteMap.crossingId(x, b),
        ],
      ),
    );
    const chargerEntries = RouteMap.CHARGER_X.map(
      (x, k): RouteLane => [
        RouteMap.chargerId(k),
        RouteMap.crossingId(x, RouteMap.AISLE_Y[0]),
      ],
    );

    return rows.concat(columns, chargerEntries);
  }

  /** 맨 아래 가로 통로에는 충전기 진입로 갈림점도 있다. */
  private static rowX(y: number) {
    if (y !== RouteMap.AISLE_Y[0]) {
      return RouteMap.AISLE_X;
    }

    return RouteMap.AISLE_X.concat(RouteMap.CHARGER_X).sort((a, b) => a - b);
  }

  private static crossingKind(x: number, y: number): RouteNodeKind {
    if (!RouteMap.AISLE_X.includes(x)) {
      return "JUNCTION";
    }

    return y === RouteMap.SHIPPING_Y ? "STATION" : "STORAGE";
  }

  private static consecutivePairs(values: number[]) {
    return values.slice(1).map((value, i) => [values[i], value]);
  }

  private static crossingId(x: number, y: number) {
    return `N-${x}-${y}`;
  }

  private static chargerId(index: number) {
    return `CHG-${index + 1}`;
  }

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
