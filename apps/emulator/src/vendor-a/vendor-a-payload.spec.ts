import { Robot } from "../simulation/robot";
import { VendorAPayloadBuilder } from "./vendor-a-payload";

describe("VendorAPayloadBuilder", () => {
  const builder = new VendorAPayloadBuilder();

  it("토픽은 vendorA/amr/{serial}/state 이다", () => {
    expect(builder.topic(new Robot("A-007"))).toBe("vendorA/amr/A-007/state");
  });

  it("제조사 A 형식(m, rad, soc 0~1, 소문자 mode)으로 만든다", () => {
    const robot = new Robot("A-001");
    robot.seq = 5;
    robot.x = 1.5;
    robot.y = 2.5;
    robot.theta = Math.PI;
    robot.speed = 0.8;
    robot.batteryPct = 75;
    robot.mode = "CHARGING";
    robot.loaded = true;
    const now = new Date("2026-11-19T00:00:00.000Z");

    const payload = builder.build(robot, now);

    expect(payload).toEqual({
      seq: 5,
      ts: "2026-11-19T00:00:00.000Z",
      pose: { x: 1.5, y: 2.5, theta: Math.PI },
      velocity: 0.8,
      battery: { soc: 0.75 },
      mode: "charging",
      fault: null,
      payload: { loaded: true },
    });
  });
});
