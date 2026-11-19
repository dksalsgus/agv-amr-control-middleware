import { MAP_HEIGHT_M, MAP_WIDTH_M } from "../config";
import { RouteMap } from "./route-map";
import { RouteNode } from "./route-map.types";

const nodeById = (id: string) =>
  RouteMap.NODES.find((node) => node.id === id) as RouteNode;

const isLane = (a: RouteNode, b: RouteNode) =>
  RouteMap.LANES.some(
    (lane) =>
      (lane[0] === a.id && lane[1] === b.id) ||
      (lane[0] === b.id && lane[1] === a.id),
  );

describe("RouteMap", () => {
  const routeMap = new RouteMap();

  it("모든 통로는 있는 지점끼리 잇고, 지점은 맵 안에 있다", () => {
    for (const lane of RouteMap.LANES) {
      expect(nodeById(lane[0])).toBeDefined();
      expect(nodeById(lane[1])).toBeDefined();
    }

    for (const node of RouteMap.NODES) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(MAP_WIDTH_M);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(MAP_HEIGHT_M);
    }
  });

  it("경로는 통로로 이어진 지점만 거쳐 목적지에 닿는다", () => {
    const from = nodeById("WS-1");
    const to = nodeById("STO-3");

    const path = routeMap.findPath(from, to);

    expect(path[path.length - 1]).toBe(to);
    [from].concat(path).reduce((previous, node) => {
      expect(isLane(previous, node)).toBe(true);
      return node;
    });
  });

  it("어느 지점에서든 모든 지점으로 갈 수 있다", () => {
    for (const from of RouteMap.NODES) {
      for (const to of RouteMap.NODES) {
        const path = routeMap.findPath(from, to);
        const arrived = from === to || path[path.length - 1] === to;

        expect(arrived).toBe(true);
      }
    }
  });

  it("가장 적은 지점을 거치는 충전소를 고른다", () => {
    expect(routeMap.nearestCharger(nodeById("WS-7")).id).toBe("CHG-3");
    expect(routeMap.nearestCharger(nodeById("CHG-2")).id).toBe("CHG-2");
  });
});
