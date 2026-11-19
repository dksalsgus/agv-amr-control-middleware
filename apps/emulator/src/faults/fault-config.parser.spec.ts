import { FaultConfigParser } from "./fault-config.parser";

describe("FaultConfigParser", () => {
  const parser = new FaultConfigParser();
  const valid = {
    disconnected: false,
    delayMs: 2000,
    duplicatePct: 30,
    reorderPct: 30,
    lossPct: 0,
  };

  it("맞는 본문이면 설정을 돌려준다", () => {
    expect(parser.parse(valid)).toEqual({ config: valid });
  });

  it("범위를 벗어나거나 빠진 값은 이유를 모두 돌려준다", () => {
    expect(
      parser.parse({
        disconnected: "yes",
        delayMs: 20000,
        duplicatePct: 101,
        reorderPct: 1.5,
      }),
    ).toEqual({
      errors: [
        "disconnected는 true 또는 false",
        "delayMs는 0~10000",
        "duplicatePct는 0~100",
        "reorderPct는 정수",
        "lossPct는 정수",
      ],
    });
  });

  it("그룹 이름은 A, B, C, PLC만 받는다", () => {
    expect(parser.parseGroup("PLC")).toBe("PLC");
    expect(parser.parseGroup("D")).toBeNull();
  });
});
