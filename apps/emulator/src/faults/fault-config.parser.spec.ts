import { FaultSettings } from "./fault-settings";
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

describe("FaultSettings 장비 값 주입", () => {
  it("켠 PLC 점과 오류를 넣은 로봇을 돌려준다", () => {
    const settings = new FaultSettings();

    settings.setPlcPoint(8, true);
    settings.setPlcPoint(2, true);
    settings.setPlcPoint(2, false);
    settings.setRobotError("C-004", true);

    expect(settings.getDevices()).toEqual({
      plcPointsOn: [8],
      robotErrors: ["C-004"],
    });
  });
});

describe("FaultConfigParser 장비 경로", () => {
  it("PLC 점 번호는 0~15, serial은 A-001 꼴만 받는다", () => {
    const parser = new FaultConfigParser();

    expect(parser.parsePointNo("15")).toBe(15);
    expect(parser.parsePointNo("16")).toBeNull();
    expect(parser.parseSerial("B-030")).toBe("B-030");
    expect(parser.parseSerial("D-001")).toBeNull();
    expect(parser.parseSwitch({ on: true }, "on")).toBe(true);
    expect(parser.parseSwitch({ on: "yes" }, "on")).toBeNull();
  });
});
