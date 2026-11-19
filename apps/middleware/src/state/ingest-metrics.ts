/** 수집 구간 집계(메모리). 연결 이름(제조사 + 프로토콜)마다 하나 */
export type IngestMetricsEntry = {
  key: string;
  received: number;
  accepted: number;
  duplicates: number;
  outOfOrder: number;
  /** seq가 건너뛴 개수의 합 */
  missed: number;
  /** 받아들인 메시지의 수신 시각 - 발생 시각(ms). 최근 것만 남긴다 */
  latenciesMs: number[];
};
