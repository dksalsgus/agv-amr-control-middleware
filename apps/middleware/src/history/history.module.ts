import { Module } from "@nestjs/common";
import { LogsRepository } from "./logs.repository";
import { VendorsConnectionsDevicesPlcPointsEventsRepository } from "./vendors-connections-devices-plc-points-events.repository";
import { VendorsConnectionsDevicesTelemetryRepository } from "./vendors-connections-devices-telemetry.repository";

@Module({
  providers: [
    VendorsConnectionsDevicesTelemetryRepository,
    VendorsConnectionsDevicesPlcPointsEventsRepository,
    LogsRepository,
  ],
  exports: [
    VendorsConnectionsDevicesTelemetryRepository,
    VendorsConnectionsDevicesPlcPointsEventsRepository,
    LogsRepository,
  ],
})
export class HistoryModule {}
