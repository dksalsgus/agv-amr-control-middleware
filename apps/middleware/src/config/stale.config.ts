import { registerAs } from "@nestjs/config";

/** STALE 판정 기준 */
export const staleConfig = registerAs("stale", () => ({
  /** 로봇이 이만큼 조용하면 STALE */
  robotSilenceMs: 3000,
  /** PLC가 이만큼 조용하면 STALE */
  plcSilenceMs: 1500,
  /** 수신 시각 - 원천 시각이 이보다 크면 STALE */
  maxDelayMs: 3000,
}));
