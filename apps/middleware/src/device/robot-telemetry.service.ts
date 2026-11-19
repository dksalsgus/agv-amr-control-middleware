import { Injectable, NotFoundException } from "@nestjs/common";
import { TelemetryRow } from "../history/vendors-connections-devices-telemetry.repository";
import { GetRobotTelemetryQueryDto } from "./dto/get-robot-telemetry.request.dto";
import {
  GetRobotTelemetryItemDto,
  GetRobotTelemetryResponseDto,
} from "./dto/get-robot-telemetry.response.dto";
import { RobotsProvider } from "./robots.provider";
import { TelemetryQueryProvider } from "./telemetry-query.provider";

@Injectable()
export class RobotTelemetryService {
  constructor(
    private readonly robotsProvider: RobotsProvider,
    private readonly telemetryQueryProvider: TelemetryQueryProvider,
  ) {}

  async getTelemetry(
    id: string,
    query: GetRobotTelemetryQueryDto,
  ): Promise<GetRobotTelemetryResponseDto> {
    if (!this.robotsProvider.findById(id)) {
      throw new NotFoundException(`로봇이 없습니다: ${id}`);
    }

    const { rows, total } = await this.telemetryQueryProvider.findPage({
      deviceId: id,
      from: query.from,
      to: query.to,
      skip: query.skip,
      take: query.size,
    });

    return {
      items: rows.map((row) => this.toItem(row)),
      page: query.page,
      size: query.size,
      total,
    };
  }

  private toItem(row: TelemetryRow): GetRobotTelemetryItemDto {
    return {
      id: row.id.toString(),
      seq: Number(row.seq),
      sourceTs: row.source_ts.toISOString(),
      receivedTs: row.received_ts.toISOString(),
      x: row.x,
      y: row.y,
      theta: row.theta,
      speed: row.speed,
      batteryPct: row.battery_pct,
      opState: row.op_state,
      errorCode: row.error_code,
      loaded: row.loaded,
    };
  }
}
