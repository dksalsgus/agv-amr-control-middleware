import { VendorCAdapter } from "./vendor-c.adapter";

const block = (overrides: Record<number, number> = {}) => {
  const registers = new Array<number>(16).fill(0);
  const ms = 1_700_000_000_123;

  registers[0] = 1;
  registers[1] = 4464;
  registers[2] = Math.floor(ms / 0x100000000);
  registers[3] = Math.floor(ms / 0x10000) % 0x10000;
  registers[4] = ms % 0x10000;
  registers[5] = 1234;
  registers[6] = 0x10000 - 50;
  registers[7] = 1800;
  registers[8] = 75;
  registers[9] = 64;
  registers[10] = 2;
  registers[11] = 0;
  registers[12] = 1;

  for (const [index, value] of Object.entries(overrides)) {
    registers[Number(index)] = value;
  }
  return registers;
};

describe("VendorCAdapter", () => {
  const adapter = new VendorCAdapter();

  it("레지스터 블록을 공통 모델로 바꾼다 (cm→m, 0.1도→도, cm/s→m/s)", () => {
    const [reading] = adapter.toCommon({
      firstBlock: 3,
      blockSize: 16,
      registers: block(),
    });

    expect(reading).toEqual({
      externalId: "3",
      seq: 70_000,
      sourceTs: new Date(1_700_000_000_123),
      x: 12.34,
      y: -0.5,
      theta: 180,
      speed: 0.75,
      batteryPct: 64,
      opState: "CHARGING",
      errorCode: null,
      loaded: true,
    });
  });

  it("이어 붙은 블록을 firstBlock부터 차례로 나눈다", () => {
    const registers = [...block(), ...block(), ...block()];

    const readings = adapter.toCommon({
      firstBlock: 7,
      blockSize: 16,
      registers,
    });

    expect(readings.map((reading) => reading.externalId)).toEqual([
      "7",
      "8",
      "9",
    ]);
  });

  it("상태 4와 오류 코드를 ERROR와 코드 문자열로 바꾼다", () => {
    const [reading] = adapter.toCommon({
      firstBlock: 0,
      blockSize: 16,
      registers: block({ 10: 4, 11: 31 }),
    });

    expect(reading.opState).toBe("ERROR");
    expect(reading.errorCode).toBe("31");
  });
});
