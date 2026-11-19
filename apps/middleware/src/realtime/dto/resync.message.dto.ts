import { IsInt, Min } from "class-validator";

export class ResyncMessageDto {
  @IsInt()
  @Min(0)
  lastRev!: number;
}
