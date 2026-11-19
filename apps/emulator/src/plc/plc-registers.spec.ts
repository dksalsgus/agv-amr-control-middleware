import { PlcRegisterEncoder } from "./plc-registers";
import { PlcSimulator } from "./plc-simulator";

describe("PlcRegisterEncoder", () => {
  it("점 16개를 워드 하나의 비트로, seq와 시각을 이어지는 레지스터로 담는다", () => {
    const plc = new PlcSimulator();
    plc.points[0] = true;
    plc.points[3] = true;
    plc.points[15] = true;
    plc.seq = 70_000;
    const ms = 1_700_000_000_123;

    const registers = new PlcRegisterEncoder().encode(plc, new Date(ms));

    expect(registers[0]).toBe(0b1000_0000_0000_1001);
    expect(registers[1] * 0x10000 + registers[2]).toBe(70_000);
    expect(
      registers[3] * 0x100000000 + registers[4] * 0x10000 + registers[5],
    ).toBe(ms);
  });
});

describe("PlcSimulator", () => {
  it("step마다 seq만 오르고 신호는 그대로 정상(false)이다", () => {
    const plc = new PlcSimulator();

    Array.from({ length: 1000 }).forEach(() => plc.step());

    expect(plc.seq).toBe(1000);
    expect(plc.points.every((on) => !on)).toBe(true);
  });
});
