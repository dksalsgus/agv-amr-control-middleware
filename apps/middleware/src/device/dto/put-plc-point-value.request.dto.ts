import { IsBoolean } from "class-validator";

export class PutPlcPointValueRequestDto {
  /** 쓸 값. true면 ON */
  @IsBoolean()
  value!: boolean;
}
