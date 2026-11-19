import { IsInt, IsOptional, IsString, Min } from "class-validator";

/** 처음 접속이면 epoch와 lastRev를 비운다. */
export class HelloMessageDto {
  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsString()
  epoch?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  lastRev?: number;
}
