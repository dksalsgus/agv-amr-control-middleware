import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";
import {
  CONNECTION_PROTOCOLS,
  ConnectionProtocol,
} from "../../ingest/providers/connection.provider";
import {
  ModbusConfigDto,
  MqttConfigDto,
  RestConfigDto,
} from "./connection-config.dto";

/** config는 protocol에 맞는 것 하나를 보낸다. */
export class PostConnectionRequestDto {
  @IsUUID()
  vendorId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsIn(CONNECTION_PROTOCOLS)
  protocol!: ConnectionProtocol;

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
