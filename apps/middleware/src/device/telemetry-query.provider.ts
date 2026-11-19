import { Injectable } from "@nestjs/common";
import {
  TelemetryPageQuery,
  VendorsConnectionsDevicesTelemetryRepository,
} from "../history/vendors-connections-devices-telemetry.repository";

@Injectable()
export class TelemetryQueryProvider {
  constructor(
    private readonly telemetryRepository: VendorsConnectionsDevicesTelemetryRepository,
  ) {}

  findPage(query: TelemetryPageQuery) {
    return this.telemetryRepository.findPage(query);
  }
}
