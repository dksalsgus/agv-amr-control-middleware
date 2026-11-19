import { Injectable } from "@nestjs/common";
import { vendors } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type VendorRow = vendors;

@Injectable()
export class VendorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<VendorRow[]> {
    return await this.prisma.vendors.findMany({ orderBy: { code: "asc" } });
  }
}
