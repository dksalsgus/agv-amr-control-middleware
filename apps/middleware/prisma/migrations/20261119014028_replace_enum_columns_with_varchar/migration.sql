-- DB 컬럼에 enum 타입을 쓰지 않는다. 허용값은 코드의 상수와 class-validator로 검증한다.
-- 기존 값을 잃지 않도록 컬럼을 지우지 않고 text로 형 변환한다.

ALTER TABLE "vendors_connections"
  ALTER COLUMN "protocol" TYPE VARCHAR(20) USING "protocol"::text;

ALTER TABLE "vendors_connections_devices"
  ALTER COLUMN "type" TYPE VARCHAR(20) USING "type"::text;

ALTER TABLE "vendors_connections_devices_plc_points"
  ALTER COLUMN "type" TYPE VARCHAR(20) USING "type"::text;

ALTER TABLE "vendors_connections_devices_telemetry"
  ALTER COLUMN "op_state" TYPE VARCHAR(20) USING "op_state"::text;

DROP TYPE "vendors_connections_protocol";
DROP TYPE "vendors_connections_devices_type";
DROP TYPE "vendors_connections_devices_plc_points_type";
DROP TYPE "vendors_connections_devices_telemetry_op_state";
