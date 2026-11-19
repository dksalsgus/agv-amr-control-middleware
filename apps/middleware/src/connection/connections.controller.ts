import { Controller, Get } from "@nestjs/common";
import { ApiResult } from "../common/dto/api-result";
import { ConnectionsService } from "./connections.service";
import { GetConnectionsResponseDto } from "./dto/get-connections.response.dto";

@Controller("connections")
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Get()
  async getConnections(): Promise<ApiResult<GetConnectionsResponseDto>> {
    const response = await this.connectionsService.getConnections();
    return ApiResult.ofSuccess(response);
  }
}
