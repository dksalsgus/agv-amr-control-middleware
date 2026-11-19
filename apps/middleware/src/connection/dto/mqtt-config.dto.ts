import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from "class-validator";

/** MQTT config. password를 빼면 저장된 값을 유지한다. */
export class MqttConfigDto {
  @Matches(/^mqtts?:\/\/.+/)
  url!: string;

  @IsString()
  @IsNotEmpty()
  topicPattern!: string;

  @IsIn([0, 1, 2])
  qos!: 0 | 1 | 2;

  @IsOptional()
  @IsString()
  username?: string | null;

  @IsOptional()
  @IsString()
  password?: string | null;
}
