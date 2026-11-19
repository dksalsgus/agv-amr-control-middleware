import { Type } from "class-transformer";
import { IsDate, IsOptional, IsUUID } from "class-validator";
import { PageRequestDto } from "../../common/dto/page.request.dto";

export class GetRobotTelemetryParamDto {
  @IsUUID()
  id!: string;
}

export class GetRobotTelemetryQueryDto extends PageRequestDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}
