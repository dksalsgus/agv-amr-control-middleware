import { Type } from "class-transformer";
import { IsDate, IsIn, IsOptional } from "class-validator";
import { PageRequestDto } from "../../common/dto/page.request.dto";
import { LOG_TYPES, LogType } from "../log";

export class GetLogsQueryDto extends PageRequestDto {
  @IsOptional()
  @IsIn(LOG_TYPES)
  type?: LogType;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}
