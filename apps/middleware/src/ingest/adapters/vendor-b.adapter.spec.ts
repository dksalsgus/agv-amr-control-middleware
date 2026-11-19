import { VendorBAdapter } from "./vendor-b.adapter";

const toVehicle = (vehicleId: string, status: string, errorCode: string) => ({
  vehicleId,
  sequence: 21,
  timestamp: 1_700_000_000_000,
  position: { xMm: 12345, yMm: 6789 },
  headingDeg: 370,
  speedMmS: 750,
  batteryLevel: 64,
  status,
  errorCode,
  hasLoad: true,
});

const vehicle = toVehicle("B-003", "RUN", "");

describe("VendorBAdapter", () => {
  const adapter = new VendorBAdapter();

  it("MQTT로 받은 한 대 본문도 REST와 같게 바꾼다", async () => {
    const [fromMqtt] = await adapter.toCommon({
      topic: "vendorB/agv/B-003/state",
      payload: Buffer.from(JSON.stringify(vehicle)),
    });
    const [fromRest] = await adapter.toCommon({ body: vehicle });

    expect(fromMqtt).toEqual(fromRest);
  });

  it("mm는 m로, mm/s는 m/s로, 도는 0~360으로 바꾼다", async () => {
    const [reading] = await adapter.toCommon({ body: vehicle });

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

  it("전체 목록 응답은 차량마다 하나씩 바꾼다", async () => {
    const body = {
      vehicles: [vehicle, toVehicle("B-004", "RUN", "")],
    };

    const readings = await adapter.toCommon({ body });

    expect(readings.map((reading) => reading.externalId)).toEqual([
      "B-003",
      "B-004",
    ]);
  });

  it("ERR와 오류 코드를 ERROR와 코드로 바꾼다", async () => {
    const body = toVehicle("B-003", "ERR", "B-E07");

    const [reading] = await adapter.toCommon({ body });

    expect(reading.opState).toBe("ERROR");
    expect(reading.errorCode).toBe("B-E07");
  });
});
