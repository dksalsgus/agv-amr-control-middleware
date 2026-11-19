import { Injectable, NotFoundException } from "@nestjs/common";
import { PlcPointEventRow } from "../history/vendors-connections-devices-plc-points-events.repository";
import { PlcPointEntry } from "../state/plc-point-state";
import { GetPlcPointEventsQueryDto } from "./dto/get-plc-point-events.request.dto";
import {
  GetPlcPointEventsItemDto,
  GetPlcPointEventsResponseDto,
} from "./dto/get-plc-point-events.response.dto";
import {
  GetPlcPointsItemDto,
  GetPlcPointsResponseDto,
} from "./dto/get-plc-points.response.dto";
import { PlcEventsQueryProvider } from "./plc-events-query.provider";
import { PlcPointsProvider } from "./plc-points.provider";

@Injectable()
export class PlcPointsService {
  constructor(
    private readonly plcPointsProvider: PlcPointsProvider,
    private readonly plcEventsQueryProvider: PlcEventsQueryProvider,
  ) {}

  getPlcPoints(): GetPlcPointsResponseDto {
    const plcPoints = this.plcPointsProvider
      .findAll()
      .sort((a, b) => a.pointNo - b.pointNo)
      .map((entry) => this.toItem(entry));

    return { plcPoints };
  }

  async getEvents(
    id: string,
    query: GetPlcPointEventsQueryDto,
  ): Promise<GetPlcPointEventsResponseDto> {
    if (!this.plcPointsProvider.findById(id)) {
      throw new NotFoundException(`PLC 점이 없습니다: ${id}`);
    }

    const { rows, total } = await this.plcEventsQueryProvider.findPage({
      pointId: id,
      from: query.from,
      to: query.to,
      skip: query.skip,
      take: query.size,
    });

    return {
      items: rows.map((row) => this.toEventItem(row)),
      page: query.page,
      size: query.size,
      total,
    };
  }

  private toItem(entry: PlcPointEntry): GetPlcPointsItemDto {
    const value = entry.current?.value ?? null;

    return {
      id: entry.pointId,
      deviceId: entry.deviceId,
      pointNo: entry.pointNo,
      name: entry.name,
      type: entry.type,
      normalValue: entry.normalValue,
      alarmOnAbnormal: entry.alarmOnAbnormal,
      value,
      abnormal: value !== null && value !== entry.normalValue,
      changedAt: entry.current?.sourceTs.toISOString() ?? null,
      rev: entry.rev,
    };
  }

  private toEventItem(row: PlcPointEventRow): GetPlcPointEventsItemDto {
    return {
      id: row.id.toString(),
      value: row.value,
      seq: Number(row.seq),
      sourceTs: row.source_ts.toISOString(),
      receivedTs: row.received_ts.toISOString(),
    };
  }
}
