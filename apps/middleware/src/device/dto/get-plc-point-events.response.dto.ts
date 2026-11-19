import { GetPlcPointEventsItemDto } from "./get-plc-point-events.item.dto";

export class GetPlcPointEventsResponseDto {
  items!: GetPlcPointEventsItemDto[];
  page!: number;
  size!: number;
  total!: number;
}
