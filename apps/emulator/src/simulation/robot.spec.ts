import { Robot } from "./robot";
import { RouteMap } from "./route-map";
import { RouteNode } from "./route-map.types";

const nodeById = (id: string) =>
  RouteMap.NODES.find((node) => node.id === id) as RouteNode;

const isOnLane = (x: number, y: number) =>
  RouteMap.LANES.some((lane) => {
    const a = nodeById(lane[0]);
    const b = nodeById(lane[1]);
    const cross = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
    const withinX =
      x >= Math.min(a.x, b.x) - 1e-6 && x <= Math.max(a.x, b.x) + 1e-6;
    const withinY =
      y >= Math.min(a.y, b.y) - 1e-6 && y <= Math.max(a.y, b.y) + 1e-6;

    return Math.abs(cross) < 1e-6 && withinX && withinY;
  });

describe("Robot", () => {
  it("step마다 seq가 1씩 오른다", () => {
    const robot = new Robot("A-001");

    robot.step(1);
    robot.step(1);

    expect(robot.seq).toBe(2);
  });

  it("통로 위로만 초당 1m 이하로 움직인다", () => {
    const robot = new Robot("A-001");
    robot.batteryPct = 100;

    Array.from({ length: 300 }).forEach(() => {
      robot.step(1);

      expect(isOnLane(robot.x, robot.y)).toBe(true);
      expect(robot.speed).toBeLessThanOrEqual(1);
    });
  });

  it("배터리가 30% 아래로 내려가면 충전소까지 가서 충전한다", () => {
    const robot = new Robot("A-001");
    robot.batteryPct = 30.01;

    Array.from({ length: 300 }).some(() => {
      robot.step(1);
      return robot.mode === "CHARGING";
    });

    const chargers = RouteMap.NODES.filter((node) => node.kind === "CHARGER");
    expect(robot.mode).toBe("CHARGING");
    expect(robot.speed).toBe(0);
    expect(
      chargers.some((node) => node.x === robot.x && node.y === robot.y),
    ).toBe(true);
  });

  it("충전소에 닿을 때까지 배터리가 20% 아래로 내려가지 않는다", () => {
    const robot = new Robot("A-001");
    robot.batteryPct = 30.01;

    Array.from({ length: 300 }).some(() => {
      robot.step(1);
      expect(robot.batteryPct).toBeGreaterThanOrEqual(20);
      return robot.mode === "CHARGING";
    });

    expect(robot.mode).toBe("CHARGING");
  });

  it("충전이 끝나면 IDLE이 된다", () => {
    const robot = new Robot("A-001");
    robot.mode = "CHARGING";
    robot.batteryPct = 99.5;

    robot.step(1);

    expect(robot.batteryPct).toBe(100);
    expect(robot.mode).toBe("IDLE");
  });
});
