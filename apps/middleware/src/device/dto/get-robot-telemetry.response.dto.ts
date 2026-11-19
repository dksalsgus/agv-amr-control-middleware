import { GetRobotTelemetryItemDto } from "./get-robot-telemetry.item.dto";

export class GetRobotTelemetryResponseDto {
  items!: GetRobotTelemetryItemDto[];
  page!: number;
  size!: number;
  total!: number;
}
