import { Injectable } from "@nestjs/common";
import {
  TelemetryPageQuery,
  TelemetryRow,
  VendorsConnectionsDevicesTelemetryRepository,
} from "../history/vendors-connections-devices-telemetry.repository";

@Injectable()
export class TelemetryQueryProvider {
  constructor(
    private readonly telemetryRepository: VendorsConnectionsDevicesTelemetryRepository,
  ) {}

  async findPage(
    query: TelemetryPageQuery,
  ): Promise<{ rows: TelemetryRow[]; total: number }> {
    return await this.telemetryRepository.findPage(query);
  }
}
