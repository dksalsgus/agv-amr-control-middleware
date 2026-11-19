import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiResult } from "../common/dto/api-result";
import { GetRobotParamDto } from "./dto/get-robot.request.dto";
import {
  GetRobotTelemetryParamDto,
  GetRobotTelemetryQueryDto,
} from "./dto/get-robot-telemetry.request.dto";
import { GetRobotTelemetryResponseDto } from "./dto/get-robot-telemetry.response.dto";
import { GetRobotResponseDto } from "./dto/get-robot.response.dto";
import { GetRobotsResponseDto } from "./dto/get-robots.response.dto";
import { RobotTelemetryService } from "./robot-telemetry.service";
import { RobotsService } from "./robots.service";

@Controller("robots")
export class RobotsController {
  constructor(
    private readonly robotsService: RobotsService,
    private readonly robotTelemetryService: RobotTelemetryService,
  ) {}

  @Get()
  async getRobots(): Promise<ApiResult<GetRobotsResponseDto>> {
    const response = await this.robotsService.getRobots();
    return ApiResult.ofSuccess(response);
  }

  @Get(":id")
  async getRobot(
    @Param() param: GetRobotParamDto,
  ): Promise<ApiResult<GetRobotResponseDto>> {
    const response = await this.robotsService.getRobot(param.id);
    return ApiResult.ofSuccess(response);
  }

  @Get(":id/telemetry")
  async getRobotTelemetry(
    @Param() param: GetRobotTelemetryParamDto,
    @Query() query: GetRobotTelemetryQueryDto,
  ): Promise<ApiResult<GetRobotTelemetryResponseDto>> {
    const response = await this.robotTelemetryService.getTelemetry(
      param.id,
      query,
    );
    return ApiResult.ofSuccess(response);
  }
}
