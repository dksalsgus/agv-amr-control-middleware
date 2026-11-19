import { Controller, Get, Param, Query } from "@nestjs/common";
import {
  GetPlcPointEventsParamDto,
  GetPlcPointEventsQueryDto,
} from "./dto/get-plc-point-events.request.dto";
import { GetPlcPointEventsResponseDto } from "./dto/get-plc-point-events.response.dto";
import { GetPlcPointsResponseDto } from "./dto/get-plc-points.response.dto";
import { PlcPointsService } from "./plc-points.service";

@Controller("plc-points")
export class PlcPointsController {
  constructor(private readonly plcPointsService: PlcPointsService) {}

  @Get()
  getPlcPoints(): GetPlcPointsResponseDto {
    return this.plcPointsService.getPlcPoints();
  }

  @Get(":id/events")
  getPlcPointEvents(
    @Param() param: GetPlcPointEventsParamDto,
    @Query() query: GetPlcPointEventsQueryDto,
  ): Promise<GetPlcPointEventsResponseDto> {
    return this.plcPointsService.getEvents(param.id, query);
  }
}
