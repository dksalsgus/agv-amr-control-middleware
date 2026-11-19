import { registerAs } from "@nestjs/config";

export const queueConfig = registerAs("queue", () => ({
  redisHost: process.env.REDIS_HOST ?? "localhost",
  redisPort: Number(process.env.REDIS_PORT ?? 6379),
  retryDelayMs: 2000,
  /** 2초 간격으로 30분 동안 다시 시도한다. */
  maxAttempts: 900,
  keepFailedJobs: 1000,
}));
