import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
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

export class RestConfigDto {
  @IsUrl({
    require_tld: false,
    require_protocol: true,
    protocols: ["http", "https"],
  })
  baseUrl!: string;

  @IsInt()
  @Min(200)
  @Max(60000)
  pollIntervalMs!: number;

  @IsIn(["bulk", "each"])
  mode!: "bulk" | "each";

  @IsInt()
  @Min(100)
  @Max(30000)
  timeoutMs!: number;
}

export class ModbusConfigDto {
  @IsString()
  @IsNotEmpty()
  host!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  port!: number;

  @IsInt()
  @Min(0)
  @Max(255)
  unitId!: number;

  @IsInt()
  @Min(100)
  @Max(60000)
  pollIntervalMs!: number;

  @IsInt()
  @Min(0)
  @Max(65535)
  baseAddress!: number;

  /** Modbus 한 요청 상한(125)을 넘지 않는다. */
  @IsInt()
  @Min(1)
  @Max(125)
  blockSize!: number;
}
