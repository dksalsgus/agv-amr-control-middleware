import { PolledFaultPicker } from "./polled-fault-picker";
import { FaultConfig } from "./fault.types";

const normal: FaultConfig = {
  disconnected: false,
  delayMs: 0,
  duplicatePct: 0,
  reorderPct: 0,
  lossPct: 0,
};

const setup = () => {
  const picker = new PolledFaultPicker<string>();
  picker.push(new Date(1000), "s1");
  picker.push(new Date(2000), "s2");
  picker.push(new Date(3000), "s3");
  return picker;
};

describe("PolledFaultPicker", () => {
  it("장애가 없으면 가장 최근 스냅샷", () => {
    expect(setup().pick(normal, 3500)).toBe("s3");
  });

  it("지연은 delayMs 전의 스냅샷", () => {
    expect(
      setup().pick(
        {
          disconnected: false,
          delayMs: 1500,
          duplicatePct: 0,
          reorderPct: 0,
          lossPct: 0,
        },
        3500,
      ),
    ).toBe("s2");
  });

  it("뒤바뀜 100%면 하나 앞 스냅샷", () => {
    expect(
      setup().pick(
        {
          disconnected: false,
          delayMs: 0,
          duplicatePct: 0,
          reorderPct: 100,
          lossPct: 0,
        },
        3500,
      ),
    ).toBe("s2");
  });

  it("중복 100%면 직전에 준 값을 다시 준다", () => {
    const picker = setup();
    picker.pick(normal, 1500);
    picker.push(new Date(4000), "s4");

    expect(
      picker.pick(
        {
          disconnected: false,
          delayMs: 0,
          duplicatePct: 100,
          reorderPct: 0,
          lossPct: 0,
        },
        4500,
      ),
    ).toBe("s1");
  });
});
