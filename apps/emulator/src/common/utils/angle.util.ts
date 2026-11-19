export const normalizeDegree = (degree: number) => ((degree % 360) + 360) % 360;

export const radianToDegree = (radian: number) =>
  normalizeDegree((radian * 180) / Math.PI);

/** 라디안 → 0.1도 단위 정수(0~3599) */
export const radianToDecidegree = (radian: number) =>
  Math.round(radianToDegree(radian) * 10) % 3600;
