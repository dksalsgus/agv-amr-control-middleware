-- CreateEnum
CREATE TYPE "vendors_connections_devices_plc_points_type" AS ENUM ('DOOR', 'INTERSECTION', 'ESTOP', 'GENERIC');

-- CreateTable
CREATE TABLE "vendors_connections_devices_plc_points" (
    "id" UUID NOT NULL,
    "vendors_connections_devices_id" UUID NOT NULL,
    "point_no" SMALLINT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "vendors_connections_devices_plc_points_type" NOT NULL,
    "normal_value" BOOLEAN NOT NULL,
    "alarm_on_abnormal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "vendors_connections_devices_plc_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors_connections_devices_plc_points_events" (
    "id" BIGSERIAL NOT NULL,
    "vendors_connections_devices_plc_points_id" UUID NOT NULL,
    "value" BOOLEAN NOT NULL,
    "seq" BIGINT NOT NULL,
    "source_ts" TIMESTAMPTZ NOT NULL,
    "received_ts" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "vendors_connections_devices_plc_points_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendors_connections_devices_plc_points_vendors_connections__key" ON "vendors_connections_devices_plc_points"("vendors_connections_devices_id", "point_no");

-- CreateIndex
CREATE INDEX "vendors_connections_devices_plc_points_events_vendors_conne_idx" ON "vendors_connections_devices_plc_points_events"("vendors_connections_devices_plc_points_id", "source_ts" DESC);

-- AddForeignKey
ALTER TABLE "vendors_connections_devices_plc_points" ADD CONSTRAINT "vendors_connections_devices_plc_points_vendors_connections_fkey" FOREIGN KEY ("vendors_connections_devices_id") REFERENCES "vendors_connections_devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors_connections_devices_plc_points_events" ADD CONSTRAINT "vendors_connections_devices_plc_points_events_vendors_conn_fkey" FOREIGN KEY ("vendors_connections_devices_plc_points_id") REFERENCES "vendors_connections_devices_plc_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
