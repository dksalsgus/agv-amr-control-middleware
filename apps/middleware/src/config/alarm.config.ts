import { registerAs } from "@nestjs/config";

export const alarmConfig = registerAs("alarm", () => ({
  evaluateIntervalMs: 500,
  lowBatteryPct: 20,
}));
