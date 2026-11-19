export const UINT16 = 0x10000;

/** 정수(음수 포함) → uint16. 음수는 2의 보수로 담긴다. */
export const toUint16 = (value: number) => ((value % UINT16) + UINT16) % UINT16;

/** uint32 → 레지스터 2칸(상위, 하위) */
export const toUint32Words = (value: number) => [
  Math.floor(value / UINT16) % UINT16,
  value % UINT16,
];

/** uint48 → 레지스터 3칸(상위, 중간, 하위) */
export const toUint48Words = (value: number) => [
  Math.floor(value / UINT16 / UINT16) % UINT16,
  Math.floor(value / UINT16) % UINT16,
  value % UINT16,
];
