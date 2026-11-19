import { Controller, Get } from "@nestjs/common";
import { ApiResult } from "../common/dto/api-result";
import { GetHealthResponseDto } from "./dto/get-health.response.dto";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): ApiResult<GetHealthResponseDto> {
    const response = this.healthService.getHealth();
    return ApiResult.ofSuccess(response);
  }
}
