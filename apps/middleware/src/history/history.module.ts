import { Module } from "@nestjs/common";
import { LogsRepository } from "./logs.repository";
import { VendorsConnectionsDevicesPlcPointsEventsRepository } from "./vendors-connections-devices-plc-points-events.repository";
import { VendorsConnectionsDevicesTelemetryRepository } from "./vendors-connections-devices-telemetry.repository";

/** 이력 테이블 Repository 모음 */
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
