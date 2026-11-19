import { registerAs } from "@nestjs/config";

export const realtimeConfig = registerAs("realtime", () => ({
  deltaIntervalMs: 100,
}));
