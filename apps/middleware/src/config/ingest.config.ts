import { registerAs } from "@nestjs/config";

// @Interval 데코레이터는 상수만 받아서 주기는 registerAs 밖 상수로 둔다.

/** 연결 설정 변경(DB)을 확인하는 간격 */
export const INGEST_SYNC_INTERVAL_MS = 2000;
/** 연결마다 다음 폴링 시각이 됐는지 보는 간격. 폴링 간격의 오차가 이만큼 생긴다. */
export const INGEST_POLL_TICK_MS = 50;
/** MQTT 연결이 조용한지 보는 간격 */
export const INGEST_PUSH_SILENCE_CHECK_MS = 1000;

export const ingestConfig = registerAs("ingest", () => ({
  modbusReadTimeoutMs: 800,
  /** seq가 줄었어도 sourceTs가 이만큼 앞서면 장비 재시작으로 본다. */
  restartThresholdMs: 5000,
}));
