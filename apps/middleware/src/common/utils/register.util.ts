export const UINT16 = 0x10000;

export const toInt16 = (value: number) =>
  value >= 0x8000 ? value - UINT16 : value;

/** 레지스터 2칸(상위, 하위) → uint32 */
export const toUint32 = (high: number, low: number) => high * UINT16 + low;

/** 레지스터 3칸(상위, 중간, 하위) → uint48 */
export const toUint48 = (high: number, middle: number, low: number) =>
  high * UINT16 * UINT16 + middle * UINT16 + low;
