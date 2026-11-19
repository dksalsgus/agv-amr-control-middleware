import { Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiResult } from "../common/dto/api-result";
import { GetMetricsConnectionsResponseDto } from "./dto/get-metrics-connections.response.dto";
import { GetMetricsResponseDto } from "./dto/get-metrics.response.dto";
import { PostMetricsResetResponseDto } from "./dto/post-metrics-reset.response.dto";
import { MetricsService } from "./metrics.service";

@Controller("metrics")
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics(): Promise<ApiResult<GetMetricsResponseDto>> {
    const response = await this.metricsService.getMetrics();
    return ApiResult.ofSuccess(response);
  }

  /** 관제 화면의 연결별 최근 30초 건수 */
  @Get("connections")
  async getConnectionStats(): Promise<
    ApiResult<GetMetricsConnectionsResponseDto>
  > {
    const response = await this.metricsService.getConnectionStats(new Date());
    return ApiResult.ofSuccess(response);
  }

  /** 측정 구간을 새로 시작한다. */
  @Post("reset")
  @HttpCode(200)
  async postReset(): Promise<ApiResult<PostMetricsResetResponseDto>> {
    const response = await this.metricsService.reset();
    return ApiResult.ofSuccess(response);
  }
}
