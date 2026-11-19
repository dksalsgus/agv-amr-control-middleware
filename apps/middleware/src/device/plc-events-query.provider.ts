import { Injectable } from "@nestjs/common";
import {
  PlcPointEventPageQuery,
  PlcPointEventRow,
  VendorsConnectionsDevicesPlcPointsEventsRepository,
} from "../history/vendors-connections-devices-plc-points-events.repository";

@Injectable()
export class PlcEventsQueryProvider {
  constructor(
    private readonly eventsRepository: VendorsConnectionsDevicesPlcPointsEventsRepository,
  ) {}

  async findPage(
    query: PlcPointEventPageQuery,
  ): Promise<{ rows: PlcPointEventRow[]; total: number }> {
    return await this.eventsRepository.findPage(query);
  }
}
