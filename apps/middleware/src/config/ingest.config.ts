import { registerAs } from "@nestjs/config";

export const ingestConfig = registerAs("ingest", () => ({
  /** 연결 설정 변경(DB)을 확인하는 간격 */
  syncIntervalMs: 2000,
  modbusReadTimeoutMs: 800,
  /** seq가 줄었어도 sourceTs가 이만큼 앞서면 장비 재시작으로 본다. */
  restartThresholdMs: 5000,
}));
