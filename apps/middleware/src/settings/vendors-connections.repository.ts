import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const WITH_VENDOR_AND_DEVICES = {
  vendors: true,
  vendors_connections_devices: {
    where: { enabled: true },
    include: { vendors_connections_devices_plc_points: true },
  },
} satisfies Prisma.vendors_connectionsInclude;

export type ConnectionWithDevicesRow = Prisma.vendors_connectionsGetPayload<{
  include: typeof WITH_VENDOR_AND_DEVICES;
}>;

const WITH_VENDOR_AND_DEVICE_COUNT = {
  vendors: true,
  _count: { select: { vendors_connections_devices: true } },
} satisfies Prisma.vendors_connectionsInclude;

export type ConnectionSummaryRow = Prisma.vendors_connectionsGetPayload<{
  include: typeof WITH_VENDOR_AND_DEVICE_COUNT;
}>;

@Injectable()
export class VendorsConnectionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findEnabledWithVendorAndDevices(): Promise<ConnectionWithDevicesRow[]> {
    return await this.prisma.vendors_connections.findMany({
      where: { enabled: true },
      include: WITH_VENDOR_AND_DEVICES,
    });
  }

  async findAllWithVendor(): Promise<ConnectionSummaryRow[]> {
    return await this.prisma.vendors_connections.findMany({
      include: WITH_VENDOR_AND_DEVICE_COUNT,
      orderBy: { name: "asc" },
    });
  }

  async findByIdWithVendor(id: string): Promise<ConnectionSummaryRow | null> {
    return await this.prisma.vendors_connections.findUnique({
      where: { id },
      include: WITH_VENDOR_AND_DEVICE_COUNT,
    });
  }

  /** version이 같을 때만 고치고 version을 1 올린다. 고친 행 수를 돌려준다. */
  async updateIfVersion(
    id: string,
    version: number,
    data: Prisma.vendors_connectionsUpdateManyMutationInput,
  ): Promise<number> {
    const result = await this.prisma.vendors_connections.updateMany({
      where: { id, version },
      data: { ...data, version: { increment: 1 } },
    });
    return result.count;
  }
}
