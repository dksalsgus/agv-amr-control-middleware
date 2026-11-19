import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import {
  ModbusConfigDto,
  MqttConfigDto,
  RestConfigDto,
} from "./connection-config.dto";

export class PatchConnectionParamDto {
  @IsUUID()
  id!: string;
}

/** config는 연결의 protocol에 맞는 것 하나만 보낸다. version이 다르면 409 */
export class PatchConnectionRequestDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => MqttConfigDto)
  mqtt?: MqttConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RestConfigDto)
  rest?: RestConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ModbusConfigDto)
  modbus?: ModbusConfigDto;
}
