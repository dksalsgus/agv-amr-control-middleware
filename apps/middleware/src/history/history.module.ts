import { Module } from "@nestjs/common";
import { VendorsConnectionsDevicesPlcPointsEventsRepository } from "./vendors-connections-devices-plc-points-events.repository";
import { VendorsConnectionsDevicesTelemetryRepository } from "./vendors-connections-devices-telemetry.repository";

/** 이력 테이블 Repository 모음. 수집(ingest)이 쓰고 조회(device)가 읽는다. */
@Module({
  providers: [
    VendorsConnectionsDevicesTelemetryRepository,
    VendorsConnectionsDevicesPlcPointsEventsRepository,
  ],
  exports: [
    VendorsConnectionsDevicesTelemetryRepository,
    VendorsConnectionsDevicesPlcPointsEventsRepository,
  ],
})
export class HistoryModule {}
