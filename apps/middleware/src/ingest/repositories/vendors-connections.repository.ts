import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class VendorsConnectionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEnabledWithVendorAndDevices() {
    return this.prisma.vendors_connections.findMany({
      where: { enabled: true },
      include: {
        vendors: true,
        vendors_connections_devices: {
          where: { enabled: true },
          include: { vendors_connections_devices_plc_points: true },
        },
      },
    });
  }
}
