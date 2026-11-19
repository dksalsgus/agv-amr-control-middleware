import { IsUUID } from "class-validator";

export class PatchConnectionParamDto {
  @IsUUID()
  id!: string;
}
