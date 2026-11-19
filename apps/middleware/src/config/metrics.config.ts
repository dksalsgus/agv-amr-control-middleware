import { registerAs } from "@nestjs/config";

export const metricsConfig = registerAs("metrics", () => ({
  processSampleIntervalMs: 5000,
}));
