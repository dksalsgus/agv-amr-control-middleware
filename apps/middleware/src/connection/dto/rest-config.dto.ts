import { IsIn, IsInt, IsUrl, Max, Min } from "class-validator";

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
