import { registerAs } from "@nestjs/config";

export const realtimeConfig = registerAs("realtime", () => ({
  deltaIntervalMs: 100,
  pingIntervalMs: 5000,
  /** 이만큼 연속으로 pong이 없으면 끊긴 것으로 본다. */
  maxMissedPongs: 2,
  /** 보내지 못하고 쌓인 바이트가 이보다 많으면 그 화면의 이번 delta를 건너뛴다. */
  maxBufferedBytes: 1_000_000,
}));
