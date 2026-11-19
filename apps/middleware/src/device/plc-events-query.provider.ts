import { Injectable } from "@nestjs/common";
import {
  PlcPointEventPageQuery,
  VendorsConnectionsDevicesPlcPointsEventsRepository,
} from "../history/vendors-connections-devices-plc-points-events.repository";

@Injectable()
export class PlcEventsQueryProvider {
  constructor(
    private readonly eventsRepository: VendorsConnectionsDevicesPlcPointsEventsRepository,
  ) {}

  findPage(query: PlcPointEventPageQuery) {
    return this.eventsRepository.findPage(query);
  }
}
