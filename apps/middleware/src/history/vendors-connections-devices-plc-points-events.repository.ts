import { Injectable } from "@nestjs/common";

import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

import {
  PlcPointEventRow,
  PlcPointEventPageQuery,
} from "./vendors-connections-devices-plc-points-events.types";

@Injectable()
export class VendorsConnectionsDevicesPlcPointsEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async insert(
    data: Prisma.vendors_connections_devices_plc_points_eventsUncheckedCreateInput,
  ): Promise<PlcPointEventRow> {
    return await this.prisma.vendors_connections_devices_plc_points_events.create(
      {
        data,
      },
    );
  }

  /** 점별 마지막 이벤트. 그 값이 곧 현재 값이라 재시작 복구에 쓴다. */
  async findLatestPerPoint(): Promise<PlcPointEventRow[]> {
    return await this.prisma.$queryRaw<PlcPointEventRow[]>`
      SELECT DISTINCT ON (vendors_connections_devices_plc_points_id) *
      FROM vendors_connections_devices_plc_points_events
      ORDER BY vendors_connections_devices_plc_points_id, source_ts DESC
    `;
  }

  async findPage(
    query: PlcPointEventPageQuery,
  ): Promise<{ rows: PlcPointEventRow[]; total: number }> {
    const where: Prisma.vendors_connections_devices_plc_points_eventsWhereInput =
      {
        vendors_connections_devices_plc_points_id: query.pointId,
        source_ts: { gte: query.from, lte: query.to },
      };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.vendors_connections_devices_plc_points_events.findMany({
        where,
        orderBy: { source_ts: "desc" },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.vendors_connections_devices_plc_points_events.count({
        where,
      }),
    ]);

    return { rows, total };
  }
}
