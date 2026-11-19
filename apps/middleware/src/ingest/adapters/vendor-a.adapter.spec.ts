import { VendorAAdapter } from "./vendor-a.adapter";

const toRaw = (topic: string, payload: object) => ({
  topic,
  payload: Buffer.from(JSON.stringify(payload)),
});

const basePayload = {
  seq: 12,
  ts: "2026-11-19T00:00:01.000Z",
  pose: { x: 3.5, y: 4.25, theta: Math.PI / 2 },
  velocity: 0.8,
  battery: { soc: 0.756 },
  mode: "driving",
  fault: null,
  payload: { loaded: true },
};

describe("VendorAAdapter", () => {
  const adapter = new VendorAAdapter();

  it("제조사 A 메시지를 공통 모델로 바꾼다", () => {
    const raw = toRaw("vendorA/amr/A-007/state", basePayload);

    const [reading] = adapter.toCommon(raw);

    expect(reading).toEqual({
      externalId: "A-007",
      seq: 12,
      sourceTs: new Date("2026-11-19T00:00:01.000Z"),
      x: 3.5,
      y: 4.25,
      theta: 90,
      speed: 0.8,
      batteryPct: 76,
      opState: "MOVING",
      errorCode: null,
      loaded: true,
    });
  });

  it("음수 rad는 0~360도로 바꾼다", () => {
    const raw = toRaw("vendorA/amr/A-001/state", {
      ...basePayload,
      pose: { x: 0, y: 0, theta: -Math.PI / 2 },
    });

    const [reading] = adapter.toCommon(raw);

    expect(reading.theta).toBeCloseTo(270);
  });

  it("fault가 있으면 ERROR와 오류 코드를 준다", () => {
    const raw = toRaw("vendorA/amr/A-001/state", {
      ...basePayload,
      mode: "fault",
      fault: { code: "E-101" },
    });

    const [reading] = adapter.toCommon(raw);

    expect(reading.opState).toBe("ERROR");
    expect(reading.errorCode).toBe("E-101");
  });

  it("토픽에 serial이 없으면 예외를 던진다", () => {
    const raw = toRaw("vendorA", basePayload);

    expect(() => adapter.toCommon(raw)).toThrow();
  });
});
