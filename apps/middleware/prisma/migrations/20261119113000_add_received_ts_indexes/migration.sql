-- CreateIndex
CREATE INDEX "vendors_connections_devices_plc_points_events_received_ts_idx" ON "vendors_connections_devices_plc_points_events"("received_ts");

-- CreateIndex
CREATE INDEX "vendors_connections_devices_telemetry_received_ts_idx" ON "vendors_connections_devices_telemetry"("received_ts");
