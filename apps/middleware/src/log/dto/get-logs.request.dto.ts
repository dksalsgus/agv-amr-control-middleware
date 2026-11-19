import { Type } from "class-transformer";
import { IsDate, IsIn, IsOptional, IsUUID } from "class-validator";
import { PageRequestDto } from "../../common/dto/page.request.dto";
import { LOG_TARGET_TYPES, LOG_TYPES, LogTargetType, LogType } from "../log";

export class GetLogsQueryDto extends PageRequestDto {
  @IsOptional()
  @IsIn(LOG_TYPES)
  type?: LogType;

  /** targetId와 함께 써서 장비 하나의 기록만 본다. */
  @IsOptional()
  @IsIn(LOG_TARGET_TYPES)
  targetType?: LogTargetType;

  @IsOptional()
  @IsUUID()
  targetId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}
