import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { ApiResult } from "../common/dto/api-result";
import { ConnectionsService } from "./connections.service";
import { GetConnectionParamDto } from "./dto/get-connection.request.dto";
import { GetConnectionResponseDto } from "./dto/get-connection.response.dto";
import { GetConnectionsResponseDto } from "./dto/get-connections.response.dto";
import {
  PatchConnectionParamDto,
  PatchConnectionRequestDto,
} from "./dto/patch-connection.request.dto";
import { PatchConnectionResponseDto } from "./dto/patch-connection.response.dto";

@Controller("connections")
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Get()
  async getConnections(): Promise<ApiResult<GetConnectionsResponseDto>> {
    const response = await this.connectionsService.getConnections();
    return ApiResult.ofSuccess(response);
  }

  @Get(":id")
  async getConnection(
    @Param() param: GetConnectionParamDto,
  ): Promise<ApiResult<GetConnectionResponseDto>> {
    const response = await this.connectionsService.getConnection(param.id);
    return ApiResult.ofSuccess(response);
  }

  @Patch(":id")
  async patchConnection(
    @Param() param: PatchConnectionParamDto,
    @Body() request: PatchConnectionRequestDto,
  ): Promise<ApiResult<PatchConnectionResponseDto>> {
    const response = await this.connectionsService.patchConnection(
      param.id,
      request,
    );
    return ApiResult.ofSuccess(response);
  }
}
