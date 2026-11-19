export const pad2 = (n: number): string => String(n).padStart(2, "0");

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** HH:MM:SS */
export const formatTime = (ms: number): string => {
  const date = new Date(ms);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
};

/** HH:MM:SS.mmm */
export const formatTimeMs = (ms: number): string =>
  `${formatTime(ms)}.${String(new Date(ms).getMilliseconds()).padStart(3, "0")}`;

export const formatAgo = (elapsedMs: number): string => {
  if (elapsedMs < 1000) {
    return "방금";
  }
  if (elapsedMs < 60000) {
    const digits = elapsedMs < 10000 ? 1 : 0;
    return `${(elapsedMs / 1000).toFixed(digits)}초 전`;
  }
  if (elapsedMs < 3600000) {
    return `${Math.floor(elapsedMs / 60000)}분 전`;
  }
  return `${Math.floor(elapsedMs / 3600000)}시간 전`;
};

/** 정렬된 값에서 p 백분위 */
export const percentile = (sorted: number[], p: number): number => {
  if (sorted.length === 0) {
    return 0;
  }
  const index = Math.min(
    sorted.length - 1,
    Math.floor((p / 100) * sorted.length),
  );
  return sorted[index];
};
