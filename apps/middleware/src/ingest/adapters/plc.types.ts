/** PLC 신호 공통 모델. 16점을 한 번에 읽어 seq와 시각을 함께 든다. */
export type PlcReading = {
  externalId: string;
  seq: number;
  sourceTs: Date;
  values: boolean[];
};
