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
  it("step마다 seq가 오르고, 확률보다 작은 난수가 나온 점만 뒤집힌다", () => {
    const randoms = [0.5, 0.001, ...new Array<number>(14).fill(0.5)];
    const plc = new PlcSimulator(() => randoms.shift() ?? 0.5);

    plc.step();

    expect(plc.seq).toBe(1);
    expect(plc.points[0]).toBe(false);
    expect(plc.points[1]).toBe(true);
  });
});
