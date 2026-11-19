/** min 이상 max 미만의 실수 */
export const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);
