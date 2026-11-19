/** 연결 품질 표본 하나. 받아야 할 expected건 중 lost건을 잃었다. */
export type LinkQualitySample = {
  at: Date;
  expected: number;
  lost: number;
};
