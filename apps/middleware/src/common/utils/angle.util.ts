export const normalizeDegree = (degree: number) => ((degree % 360) + 360) % 360;

export const radianToDegree = (radian: number) =>
  normalizeDegree((radian * 180) / Math.PI);
