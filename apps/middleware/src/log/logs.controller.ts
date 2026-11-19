import { Controller, Get, Query } from "@nestjs/common";
import { ApiResult } from "../common/dto/api-result";
import { GetLogsQueryDto } from "./dto/get-logs.request.dto";
import { GetLogsResponseDto } from "./dto/get-logs.response.dto";
import { LogsService } from "./logs.service";

@Controller("logs")
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  async getLogs(
    @Query() query: GetLogsQueryDto,
  ): Promise<ApiResult<GetLogsResponseDto>> {
    const response = await this.logsService.getLogs(query);
    return ApiResult.ofSuccess(response);
  }
}
