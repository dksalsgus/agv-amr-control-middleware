import { Body, Controller, Get, Param, Put, Query } from "@nestjs/common";
import { AuthUser } from "../auth/auth.types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ApiResult } from "../common/dto/api-result";
import { GetPlcPointEventsQueryDto } from "./dto/get-plc-point-events.query.dto";
import { GetPlcPointEventsParamDto } from "./dto/get-plc-point-events.param.dto";
import { GetPlcPointEventsResponseDto } from "./dto/get-plc-point-events.response.dto";
import { GetPlcPointsResponseDto } from "./dto/get-plc-points.response.dto";
import { PutPlcPointValueParamDto } from "./dto/put-plc-point-value.param.dto";
import { PutPlcPointValueRequestDto } from "./dto/put-plc-point-value.request.dto";
import { PutPlcPointValueResponseDto } from "./dto/put-plc-point-value.response.dto";
import { PlcPointsService } from "./plc-points.service";

@Controller("plc-points")
export class PlcPointsController {
  constructor(private readonly plcPointsService: PlcPointsService) {}

  @Get()
  async getPlcPoints(): Promise<ApiResult<GetPlcPointsResponseDto>> {
    const response = await this.plcPointsService.getPlcPoints();
    return ApiResult.ofSuccess(response);
  }

  /** 인터록 제어: PLC 점 값을 쓴다. */
  @Put(":id/value")
  async putPlcPointValue(
    @Param() param: PutPlcPointValueParamDto,
    @Body() request: PutPlcPointValueRequestDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ApiResult<PutPlcPointValueResponseDto>> {
    const response = await this.plcPointsService.putValue(
      param.id,
      request,
      user,
    );
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
