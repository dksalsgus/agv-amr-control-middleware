import { Controller, Get, Param, Query } from "@nestjs/common";
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
  getRobots(): GetRobotsResponseDto {
    return this.robotsService.getRobots();
  }

  @Get(":id")
  getRobot(@Param() param: GetRobotParamDto): GetRobotResponseDto {
    return this.robotsService.getRobot(param.id);
  }

  @Get(":id/telemetry")
  getRobotTelemetry(
    @Param() param: GetRobotTelemetryParamDto,
    @Query() query: GetRobotTelemetryQueryDto,
  ): Promise<GetRobotTelemetryResponseDto> {
    return this.robotTelemetryService.getTelemetry(param.id, query);
  }
}
