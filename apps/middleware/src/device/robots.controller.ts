import { Controller, Get, Param } from "@nestjs/common";
import { GetRobotParamDto } from "./dto/get-robot.request.dto";
import { GetRobotResponseDto } from "./dto/get-robot.response.dto";
import { GetRobotsResponseDto } from "./dto/get-robots.response.dto";
import { RobotsService } from "./robots.service";

@Controller("robots")
export class RobotsController {
  constructor(private readonly robotsService: RobotsService) {}

  @Get()
  getRobots(): GetRobotsResponseDto {
    return this.robotsService.getRobots();
  }

  @Get(":id")
  getRobot(@Param() param: GetRobotParamDto): GetRobotResponseDto {
    return this.robotsService.getRobot(param.id);
  }
}
