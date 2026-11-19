import { registerAs } from "@nestjs/config";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** @Interval 데코레이터는 상수만 받아서 주기는 registerAs 밖 상수로 둔다. */
export const RETENTION_CLEANUP_INTERVAL_MS = HOUR_MS;

export const retentionConfig = registerAs("retention", () => ({
  /** 로봇 상태 이력. 초당 90행(하루 약 780만 행)이라 짧게 둔다. */
  telemetryMs: Number(process.env.RETENTION_TELEMETRY_MS ?? DAY_MS),
  /** PLC 값 변화 이력 */
  plcEventMs: Number(process.env.RETENTION_PLC_EVENT_MS ?? 30 * DAY_MS),
  /** 연결·알람 로그 */
  logMs: Number(process.env.RETENTION_LOG_MS ?? 30 * DAY_MS),
  /** 한 번에 지우는 행 수. 큰 DELETE 하나가 테이블을 오래 잡지 않게 나눈다. */
  deleteBatchSize: 10000,
}));
