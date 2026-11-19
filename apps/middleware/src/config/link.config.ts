import { registerAs } from "@nestjs/config";

/** 연결 끊김 판정과 재시도 간격 */
export const linkConfig = registerAs("link", () => ({
  /** 폴링 연결은 이만큼 연속 실패하면 끊김으로 본다. */
  downAfterFailures: 3,
  minRetryMs: 1000,
  maxRetryMs: 10000,
}));
