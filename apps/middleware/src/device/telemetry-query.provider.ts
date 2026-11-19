import { Injectable } from "@nestjs/common";
import { VendorsConnectionsDevicesTelemetryRepository } from "../history/vendors-connections-devices-telemetry.repository";
import {
  TelemetryPageQuery,
  TelemetryRow,
} from "../history/vendors-connections-devices-telemetry.types";

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
