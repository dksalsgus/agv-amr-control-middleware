import { IsUUID } from "class-validator";

export class GetPlcPointEventsParamDto {
  @IsUUID()
  id!: string;
}
