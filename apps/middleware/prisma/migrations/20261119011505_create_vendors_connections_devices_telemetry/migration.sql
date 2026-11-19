-- CreateEnum
CREATE TYPE "vendors_connections_devices_telemetry_op_state" AS ENUM ('IDLE', 'MOVING', 'CHARGING', 'PAUSED', 'ERROR');

-- CreateTable
CREATE TABLE "vendors_connections_devices_telemetry" (
    "id" BIGSERIAL NOT NULL,
    "vendors_connections_devices_id" UUID NOT NULL,
    "seq" BIGINT NOT NULL,
    "source_ts" TIMESTAMPTZ NOT NULL,
    "received_ts" TIMESTAMPTZ NOT NULL,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "theta" REAL NOT NULL,
    "speed" REAL NOT NULL,
    "battery_pct" SMALLINT NOT NULL,
    "op_state" "vendors_connections_devices_telemetry_op_state" NOT NULL,
    "error_code" TEXT,
    "loaded" BOOLEAN NOT NULL,

    CONSTRAINT "vendors_connections_devices_telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendors_connections_devices_telemetry_vendors_connections_d_idx" ON "vendors_connections_devices_telemetry"("vendors_connections_devices_id", "source_ts" DESC);

-- AddForeignKey
ALTER TABLE "vendors_connections_devices_telemetry" ADD CONSTRAINT "vendors_connections_devices_telemetry_vendors_connections__fkey" FOREIGN KEY ("vendors_connections_devices_id") REFERENCES "vendors_connections_devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
