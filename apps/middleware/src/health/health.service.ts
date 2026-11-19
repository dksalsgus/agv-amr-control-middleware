import { Injectable } from "@nestjs/common";
import { GetHealthResponseDto } from "./dto/get-health.response.dto";

@Injectable()
export class HealthService {
  async getHealth(): Promise<GetHealthResponseDto> {
    return { status: "ok" };
  }
}
