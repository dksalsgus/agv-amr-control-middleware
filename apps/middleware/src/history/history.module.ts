import { Module } from "@nestjs/common";
import { VendorsConnectionsDevicesTelemetryRepository } from "./vendors-connections-devices-telemetry.repository";

/** 이력 테이블 Repository 모음. 수집(ingest)이 쓰고 조회(device)가 읽는다. */
@Module({
  providers: [VendorsConnectionsDevicesTelemetryRepository],
  exports: [VendorsConnectionsDevicesTelemetryRepository],
})
export class HistoryModule {}
