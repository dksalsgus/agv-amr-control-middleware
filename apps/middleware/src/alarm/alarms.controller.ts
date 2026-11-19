import { Controller, Get, HttpCode, Param, Post } from "@nestjs/common";
import { ApiResult } from "../common/dto/api-result";
import { AlarmService } from "./alarm.service";
import { GetAlarmsResponseDto } from "./dto/get-alarms.response.dto";
import { PostAlarmAckParamDto } from "./dto/post-alarm-ack.param.dto";
import { PostAlarmAckResponseDto } from "./dto/post-alarm-ack.response.dto";

@Controller("alarms")
export class AlarmsController {
  constructor(private readonly alarmService: AlarmService) {}

  @Get()
  async getAlarms(): Promise<ApiResult<GetAlarmsResponseDto>> {
    const response = await this.alarmService.getAlarms();
    return ApiResult.ofSuccess(response);
  }

  @Post(":id/ack")
  @HttpCode(200)
  async postAlarmAck(
    @Param() param: PostAlarmAckParamDto,
  ): Promise<ApiResult<PostAlarmAckResponseDto>> {
    const response = await this.alarmService.ackAlarm(param.id);
    return ApiResult.ofSuccess(response);
  }
}
