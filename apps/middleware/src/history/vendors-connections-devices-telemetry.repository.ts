import { Injectable } from "@nestjs/common";
import { Prisma, vendors_connections_devices_telemetry } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type TelemetryRow = vendors_connections_devices_telemetry;

export type TelemetryPageQuery = {
  deviceId: string;
  from?: Date;
  to?: Date;
  skip: number;
  take: number;
};

@Injectable()
export class VendorsConnectionsDevicesTelemetryRepository {
  constructor(private readonly prisma: PrismaService) {}

  insert(
    data: Prisma.vendors_connections_devices_telemetryUncheckedCreateInput,
  ) {
    return this.prisma.vendors_connections_devices_telemetry.create({ data });
  }

  /** 장비별 마지막 행. 재시작 때 메모리 상태를 되살리는 데 쓴다. */
  findLatestPerDevice(): Promise<TelemetryRow[]> {
    return this.prisma.$queryRaw<TelemetryRow[]>`
      SELECT DISTINCT ON (vendors_connections_devices_id) *
      FROM vendors_connections_devices_telemetry
      ORDER BY vendors_connections_devices_id, source_ts DESC
    `;
  }

  async findPage(query: TelemetryPageQuery) {
    const where: Prisma.vendors_connections_devices_telemetryWhereInput = {
      vendors_connections_devices_id: query.deviceId,
      source_ts: { gte: query.from, lte: query.to },
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.vendors_connections_devices_telemetry.findMany({
        where,
        orderBy: { source_ts: "desc" },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.vendors_connections_devices_telemetry.count({ where }),
    ]);

    return { rows, total };
  }
}
