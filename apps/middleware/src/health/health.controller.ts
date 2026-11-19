import { Controller, Get } from "@nestjs/common";
import { GetHealthResponseDto } from "./dto/get-health.response.dto";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): GetHealthResponseDto {
    return this.healthService.getHealth();
  }
}
