import { GetLogsItemDto } from "./get-logs.item.dto";

export class GetLogsResponseDto {
  items!: GetLogsItemDto[];
  page!: number;
  size!: number;
  total!: number;
}
