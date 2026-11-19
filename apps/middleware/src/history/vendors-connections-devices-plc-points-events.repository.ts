import { Injectable } from "@nestjs/common";
import {
  Prisma,
  vendors_connections_devices_plc_points_events,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type PlcPointEventRow = vendors_connections_devices_plc_points_events;

export type PlcPointEventPageQuery = {
  pointId: string;
  from?: Date;
  to?: Date;
  skip: number;
  take: number;
};

@Injectable()
export class VendorsConnectionsDevicesPlcPointsEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  insert(
    data: Prisma.vendors_connections_devices_plc_points_eventsUncheckedCreateInput,
  ) {
    return this.prisma.vendors_connections_devices_plc_points_events.create({
      data,
    });
  }

  /** 점별 마지막 이벤트. 그 값이 곧 현재 값이라 재시작 복구에 쓴다. */
  findLatestPerPoint(): Promise<PlcPointEventRow[]> {
    return this.prisma.$queryRaw<PlcPointEventRow[]>`
      SELECT DISTINCT ON (vendors_connections_devices_plc_points_id) *
      FROM vendors_connections_devices_plc_points_events
      ORDER BY vendors_connections_devices_plc_points_id, source_ts DESC
    `;
  }

  async findPage(query: PlcPointEventPageQuery) {
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
