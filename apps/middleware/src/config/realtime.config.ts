import { registerAs } from "@nestjs/config";

/** @Interval 데코레이터는 상수만 받아서 주기는 registerAs 밖 상수로 둔다. */
export const REALTIME_DELTA_INTERVAL_MS = 100;
export const REALTIME_PING_INTERVAL_MS = 5000;

export const realtimeConfig = registerAs("realtime", () => ({
  /** 이만큼 연속으로 pong이 없으면 끊긴 것으로 본다. */
  maxMissedPongs: 2,
  /** 보내지 못하고 쌓인 바이트가 이보다 많으면 그 화면의 이번 delta를 건너뛴다. */
  maxBufferedBytes: 1_000_000,
}));
