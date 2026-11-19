import { Controller, Get } from "@nestjs/common";
import { Public } from "../common/decorators/public.decorator";
import { ApiResult } from "../common/dto/api-result";
import { GetHealthResponseDto } from "./dto/get-health.response.dto";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  async getHealth(): Promise<ApiResult<GetHealthResponseDto>> {
    const response = await this.healthService.getHealth();
    return ApiResult.ofSuccess(response);
  }
}
