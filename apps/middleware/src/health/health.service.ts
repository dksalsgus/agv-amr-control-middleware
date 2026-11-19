import { Injectable } from "@nestjs/common";
import { GetHealthResponseDto } from "./dto/get-health.response.dto";

@Injectable()
export class HealthService {
  getHealth(): GetHealthResponseDto {
    return { status: "ok" };
  }
}
