import { Controller, Get } from "@nestjs/common";
import { ApiResult } from "../common/dto/api-result";
import { GetHealthResponseDto } from "./dto/get-health.response.dto";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth(): Promise<ApiResult<GetHealthResponseDto>> {
    const response = await this.healthService.getHealth();
    return ApiResult.ofSuccess(response);
  }
}
