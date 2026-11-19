/** 가장 가까운 순위 방식의 백분위. 표본이 없으면 null */
export const percentile = (values: number[], pct: number): number | null => {
  if (values.length === 0) {
    return null;
  }

  const sorted = values.slice().sort((a, b) => a - b);
  const rank = Math.ceil((pct / 100) * sorted.length);
  return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1];
};

/** 소수 둘째 자리까지 */
export const round2 = (value: number): number => Math.round(value * 100) / 100;
