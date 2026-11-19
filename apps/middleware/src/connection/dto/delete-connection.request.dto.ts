import { IsUUID } from "class-validator";

export class DeleteConnectionParamDto {
  @IsUUID()
  id!: string;
}
