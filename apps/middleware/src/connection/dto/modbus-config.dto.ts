import { IsInt, IsNotEmpty, IsString, Max, Min } from "class-validator";

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
