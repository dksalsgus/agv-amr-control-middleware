import { Robot } from "../simulation/robot";
import { VendorBPayloadBuilder } from "./vendor-b-payload";

describe("VendorBPayloadBuilder", () => {
  it("제조사 B 형식(mm, 도, mm/s, 0~100, 대문자 약어 status)으로 만든다", () => {
    const robot = new Robot("B-003");
    robot.seq = 9;
    robot.x = 1.2345;
    robot.y = 2;
    robot.theta = -Math.PI / 2;
    robot.speed = 0.75;
    robot.batteryPct = 64.6;
    robot.mode = "DRIVING";
    robot.loaded = false;
    const sampledAt = new Date(1_700_000_000_000);

    const vehicle = new VendorBPayloadBuilder().build(robot, sampledAt);

    expect(vehicle).toEqual({
      vehicleId: "B-003",
      sequence: 9,
      timestamp: 1_700_000_000_000,
      position: { xMm: 1235, yMm: 2000 },
      headingDeg: 270,
      speedMmS: 750,
      batteryLevel: 65,
      status: "RUN",
      errorCode: "",
      hasLoad: false,
    });
  });
});

describe("VendorBPayloadBuilder 오류", () => {
  it("오류 코드가 있으면 status ERR와 E 코드를 보낸다", () => {
    const robot = new Robot("B-001");
    robot.errorCode = 101;

    const vehicle = new VendorBPayloadBuilder().build(robot, new Date());

    expect(vehicle.status).toBe("ERR");
    expect(vehicle.errorCode).toBe("E101");
  });
});
