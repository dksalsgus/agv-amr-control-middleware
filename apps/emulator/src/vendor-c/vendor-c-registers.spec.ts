import { Robot } from "../simulation/robot";
import { VendorCRegisterEncoder } from "./vendor-c-registers";

describe("VendorCRegisterEncoder", () => {
  it("차량 한 대를 레지스터 16개로 인코딩한다", () => {
    const robot = new Robot("C-001");
    robot.seq = 70_000;
    robot.x = 12.34;
    robot.y = -0.5;
    robot.theta = Math.PI;
    robot.speed = 0.75;
    robot.batteryPct = 64.6;
    robot.mode = "CHARGING";
    robot.loaded = true;
    const ms = 1_700_000_000_123;

    const registers = new VendorCRegisterEncoder().encode(robot, new Date(ms));

    expect(registers).toHaveLength(16);
    expect(registers[0] * 0x10000 + registers[1]).toBe(70_000);
    expect(
      registers[2] * 0x100000000 + registers[3] * 0x10000 + registers[4],
    ).toBe(ms);
    expect(registers[5]).toBe(1234);
    expect(registers[6]).toBe(0x10000 - 50);
    expect(registers[7]).toBe(1800);
    expect(registers[8]).toBe(75);
    expect(registers[9]).toBe(65);
    expect(registers[10]).toBe(2);
    expect(registers[11]).toBe(0);
    expect(registers[12]).toBe(1);
  });
});
