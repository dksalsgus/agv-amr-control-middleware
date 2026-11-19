import { VendorBAdapter } from "./vendor-b.adapter";

const vehicle = {
  vehicleId: "B-003",
  sequence: 21,
  timestamp: 1_700_000_000_000,
  position: { xMm: 12345, yMm: 6789 },
  headingDeg: 370,
  speedMmS: 750,
  batteryLevel: 64,
  status: "RUN",
  errorCode: "",
  hasLoad: true,
};

describe("VendorBAdapter", () => {
  const adapter = new VendorBAdapter();

  it("mm는 m로, mm/s는 m/s로, 도는 0~360으로 바꾼다", () => {
    const [reading] = adapter.toCommon({ body: vehicle });

    expect(reading).toEqual({
      externalId: "B-003",
      seq: 21,
      sourceTs: new Date(1_700_000_000_000),
      x: 12.345,
      y: 6.789,
      theta: 10,
      speed: 0.75,
      batteryPct: 64,
      opState: "MOVING",
      errorCode: null,
      loaded: true,
    });
  });

  it("전체 목록 응답은 차량마다 하나씩 바꾼다", () => {
    const body = {
      vehicles: [vehicle, { ...vehicle, vehicleId: "B-004" }],
    };

    const readings = adapter.toCommon({ body });

    expect(readings.map((reading) => reading.externalId)).toEqual([
      "B-003",
      "B-004",
    ]);
  });

  it("ERR와 오류 코드를 ERROR와 코드로 바꾼다", () => {
    const body = { ...vehicle, status: "ERR", errorCode: "B-E07" };

    const [reading] = adapter.toCommon({ body });

    expect(reading.opState).toBe("ERROR");
    expect(reading.errorCode).toBe("B-E07");
  });
});
