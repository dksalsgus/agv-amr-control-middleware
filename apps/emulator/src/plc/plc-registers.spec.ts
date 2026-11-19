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
    const randoms = new Array<number>(16).fill(0.5);
    randoms[4] = 0.001;
    const plc = new PlcSimulator(() => randoms.shift() ?? 0.5);

    plc.step();

    expect(plc.seq).toBe(1);
    expect(plc.points[0]).toBe(false);
    expect(plc.points[4]).toBe(true);
  });

  it("알람이 걸리는 도어(0~3)·비상정지(8, 9)는 다른 신호보다 드물게 바뀐다", () => {
    // 0.01은 일반 신호의 확률(0.02)보다 작고 도어·비상정지의 확률(0.0005)보다 크다.
    const plc = new PlcSimulator(() => 0.01);

    plc.step();

    const flipped = plc.points.flatMap((on, pointNo) => (on ? [pointNo] : []));
    expect(flipped).toEqual([4, 5, 6, 7, 10, 11, 12, 13, 14, 15]);
  });
});
