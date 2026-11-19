import { IsUUID } from "class-validator";

export class GetRobotTelemetryParamDto {
  @IsUUID()
  id!: string;
}
