import { IsUUID } from "class-validator";

export class GetRobotParamDto {
  @IsUUID()
  id!: string;
}
