import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiResult } from "../common/dto/api-result";
import { GetPlcPointEventsQueryDto } from "./dto/get-plc-point-events.query.dto";
import { GetPlcPointEventsParamDto } from "./dto/get-plc-point-events.param.dto";
import { GetPlcPointEventsResponseDto } from "./dto/get-plc-point-events.response.dto";
import { GetPlcPointsResponseDto } from "./dto/get-plc-points.response.dto";
import { PlcPointsService } from "./plc-points.service";

@Controller("plc-points")
export class PlcPointsController {
  constructor(private readonly plcPointsService: PlcPointsService) {}

  @Get()
  async getPlcPoints(): Promise<ApiResult<GetPlcPointsResponseDto>> {
    const response = await this.plcPointsService.getPlcPoints();
    return ApiResult.ofSuccess(response);
  }

  @Get(":id/events")
  async getPlcPointEvents(
    @Param() param: GetPlcPointEventsParamDto,
    @Query() query: GetPlcPointEventsQueryDto,
  ): Promise<ApiResult<GetPlcPointEventsResponseDto>> {
    const response = await this.plcPointsService.getEvents(param.id, query);
    return ApiResult.ofSuccess(response);
  }
}
