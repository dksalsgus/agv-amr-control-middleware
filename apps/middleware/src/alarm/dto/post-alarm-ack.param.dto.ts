import { IsUUID } from "class-validator";

export class PostAlarmAckParamDto {
  @IsUUID()
  id!: string;
}
