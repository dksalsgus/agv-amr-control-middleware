import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

import { VendorRow } from "./vendors.types";

@Injectable()
export class VendorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<VendorRow[]> {
    return await this.prisma.vendors.findMany({ orderBy: { code: "asc" } });
  }

  async findById(id: string): Promise<VendorRow | null> {
    return await this.prisma.vendors.findUnique({ where: { id } });
  }
}
