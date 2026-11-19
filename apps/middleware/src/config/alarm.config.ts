import { registerAs } from "@nestjs/config";

/** @Interval 데코레이터는 상수만 받아서 주기는 registerAs 밖 상수로 둔다. */
export const ALARM_EVALUATE_INTERVAL_MS = 500;

export const alarmConfig = registerAs("alarm", () => ({
  lowBatteryPct: 20,
}));
