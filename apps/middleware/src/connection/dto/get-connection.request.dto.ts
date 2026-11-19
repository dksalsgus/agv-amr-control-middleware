import { IsUUID } from "class-validator";

export class GetConnectionParamDto {
  @IsUUID()
  id!: string;
}
