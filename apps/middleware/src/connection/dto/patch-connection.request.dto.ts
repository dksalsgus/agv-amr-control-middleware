import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { CONNECTION_PROTOCOLS } from "../../ingest/providers/connection.constants";
import { ConnectionProtocol } from "../../ingest/providers/connection.types";
import { ModbusConfigDto } from "./modbus-config.dto";
import { RestConfigDto } from "./rest-config.dto";
import { MqttConfigDto } from "./mqtt-config.dto";

/**
 * config는 연결의 protocol에 맞는 것 하나만 보낸다. version이 다르면 409
 * protocol을 바꾸면 새 protocol의 config도 같이 보내야 한다.
 */
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
  @IsIn(CONNECTION_PROTOCOLS)
  protocol?: ConnectionProtocol;

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
