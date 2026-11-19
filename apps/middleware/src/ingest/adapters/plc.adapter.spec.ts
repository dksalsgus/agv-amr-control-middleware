import { PlcAdapter } from "./plc.adapter";

describe("PlcAdapter", () => {
  const adapter = new PlcAdapter();

  it("워드 하나를 점 16개로, 이어지는 레지스터를 seq와 시각으로 바꾼다", () => {
    const ms = 1_700_000_000_123;
    const registers = [
      0b1000_0000_0000_1001,
      1,
      4464,
      Math.floor(ms / 0x100000000),
      Math.floor(ms / 0x10000) % 0x10000,
      ms % 0x10000,
    ];

    const reading = adapter.toCommon({
      firstBlock: 0,
      blockSize: 6,
      registers,
    });

    expect(reading.externalId).toBe("0");
    expect(reading.seq).toBe(70_000);
    expect(reading.sourceTs).toEqual(new Date(ms));
    expect(reading.values).toHaveLength(16);
    expect(reading.values[0]).toBe(true);
    expect(reading.values[1]).toBe(false);
    expect(reading.values[3]).toBe(true);
    expect(reading.values[15]).toBe(true);
  });
});
