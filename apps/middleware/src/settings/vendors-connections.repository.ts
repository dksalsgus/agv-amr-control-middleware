import {
  WITH_VENDOR_AND_DEVICES,
  WITH_VENDOR_AND_DEVICE_COUNT,
} from "./vendors-connections.constants";
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  ConnectionWithDevicesRow,
  ConnectionSummaryRow,
} from "./vendors-connections.types";

@Injectable()
export class VendorsConnectionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findEnabledWithVendorAndDevices(): Promise<ConnectionWithDevicesRow[]> {
    return await this.prisma.vendors_connections.findMany({
      where: { enabled: true },
      include: WITH_VENDOR_AND_DEVICES,
    });
  }

  async findEnabledByIdWithVendorAndDevices(
    id: string,
  ): Promise<ConnectionWithDevicesRow | null> {
    return await this.prisma.vendors_connections.findFirst({
      where: { id, enabled: true },
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
      data: {
        name: data.name,
        enabled: data.enabled,
        protocol: data.protocol,
        config: data.config,
        version: { increment: 1 },
      },
    });
    return result.count;
  }

  async create(
    data: Prisma.vendors_connectionsUncheckedCreateInput,
  ): Promise<{ id: string; version: number }> {
    return await this.prisma.vendors_connections.create({
      data,
      select: { id: true, version: true },
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.vendors_connections.delete({ where: { id } });
  }
}
