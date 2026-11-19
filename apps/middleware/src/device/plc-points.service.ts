import { Injectable, NotFoundException } from "@nestjs/common";
import { PlcPointEventRow } from "../history/vendors-connections-devices-plc-points-events.types";
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
import { StaleJudgeProvider } from "./stale-judge.provider";

@Injectable()
export class PlcPointsService {
  constructor(
    private readonly plcPointsProvider: PlcPointsProvider,
    private readonly plcEventsQueryProvider: PlcEventsQueryProvider,
    private readonly staleJudgeProvider: StaleJudgeProvider,
  ) {}

  async getPlcPoints(): Promise<GetPlcPointsResponseDto> {
    const entries = await this.plcPointsProvider.findAll();
    const sorted = entries.slice().sort((a, b) => a.pointNo - b.pointNo);
    const now = new Date();

    const plcPoints: GetPlcPointsItemDto[] = [];
    for (const entry of sorted) {
      plcPoints.push(await this.toItem(entry, now));
    }

    return { plcPoints };
  }

  async getEvents(
    id: string,
    query: GetPlcPointEventsQueryDto,
  ): Promise<GetPlcPointEventsResponseDto> {
    const point = await this.plcPointsProvider.findById(id);
    if (!point) {
      throw new NotFoundException(`PLC 점이 없습니다: ${id}`);
    }

    const { rows, total } = await this.plcEventsQueryProvider.findPage({
      pointId: id,
      from: query.from,
      to: query.to,
      skip: query.skip,
      take: query.size,
    });

    const items: GetPlcPointEventsItemDto[] = [];
    for (const row of rows) {
      items.push(await this.toEventItem(row));
    }

    return { items, page: query.page, size: query.size, total };
  }

  private async toItem(
    entry: PlcPointEntry,
    now: Date,
  ): Promise<GetPlcPointsItemDto> {
    const value = entry.current?.value ?? null;
    const lastRead = await this.plcPointsProvider.findLastRead(entry.deviceId);
    const linkStatus = await this.plcPointsProvider.findLinkStatus(
      entry.connectionId,
    );

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
      stale: await this.staleJudgeProvider.isPlcStale(
        lastRead,
        linkStatus,
        now,
      ),
      rev: entry.rev,
    };
  }

  private async toEventItem(
    row: PlcPointEventRow,
  ): Promise<GetPlcPointEventsItemDto> {
    return {
      id: row.id.toString(),
      value: row.value,
      seq: Number(row.seq),
      sourceTs: row.source_ts.toISOString(),
      receivedTs: row.received_ts.toISOString(),
    };
  }
}
