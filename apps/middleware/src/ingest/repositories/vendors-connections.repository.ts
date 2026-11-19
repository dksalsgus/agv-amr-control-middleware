import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

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

@Injectable()
export class VendorsConnectionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findEnabledWithVendorAndDevices(): Promise<ConnectionWithDevicesRow[]> {
    return await this.prisma.vendors_connections.findMany({
      where: { enabled: true },
      include: WITH_VENDOR_AND_DEVICES,
    });
  }
}
