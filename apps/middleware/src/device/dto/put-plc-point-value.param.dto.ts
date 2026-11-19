import { IsUUID } from "class-validator";

export class PutPlcPointValueParamDto {
  @IsUUID()
  id!: string;
}
