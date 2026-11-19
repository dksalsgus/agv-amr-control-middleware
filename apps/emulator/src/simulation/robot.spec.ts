import { Robot } from "./robot";

describe("Robot", () => {
  it("step마다 seq가 1씩 오른다", () => {
    const robot = new Robot("A-001");

    robot.step(1);
    robot.step(1);

    expect(robot.seq).toBe(2);
  });

  it("목표 쪽으로 초당 1m 움직이고 방향각을 맞춘다", () => {
    const robot = new Robot("A-001");
    robot.x = 0;
    robot.y = 0;
    robot.batteryPct = 100;
    robot.setTarget(10, 0);

    robot.step(1);

    expect(robot.x).toBeCloseTo(1);
    expect(robot.y).toBeCloseTo(0);
    expect(robot.theta).toBeCloseTo(0);
    expect(robot.speed).toBeCloseTo(1);
    expect(robot.mode).toBe("DRIVING");
  });

  it("배터리가 20% 아래로 내려가면 멈추고 충전한다", () => {
    const robot = new Robot("A-001");
    robot.x = 0;
    robot.y = 0;
    robot.batteryPct = 20.01;
    robot.setTarget(10, 0);

    robot.step(1);

    expect(robot.mode).toBe("CHARGING");
    expect(robot.speed).toBe(0);
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
