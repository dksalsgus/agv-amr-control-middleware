import { percentile } from "./percentile.util";

describe("percentile", () => {
  it("가장 가까운 순위로 p50과 p95를 낸다", () => {
    const values = Array.from({ length: 100 }, (_, index) => index + 1);

    expect(percentile(values, 50)).toBe(50);
    expect(percentile(values, 95)).toBe(95);
  });

  it("표본이 없으면 null, 하나면 그 값", () => {
    expect(percentile([], 50)).toBeNull();
    expect(percentile([7], 95)).toBe(7);
  });
});
