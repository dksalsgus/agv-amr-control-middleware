/** 보관 기간 정리 한 번의 결과. 테이블별로 지운 행 수 */
export type RetentionResult = {
  telemetry: number;
  plcEvents: number;
  logs: number;
};

/** 한 묶음을 지우고 지운 행 수를 돌려주는 함수 */
export type DeleteBatch = (cutoff: Date, batchSize: number) => Promise<number>;
