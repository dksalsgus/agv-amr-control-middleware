import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { LogRow, LogPageQuery } from "./logs.types";

@Injectable()
export class LogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async insert(data: Prisma.logsUncheckedCreateInput): Promise<LogRow> {
    return await this.prisma.logs.create({ data });
  }

  async findPage(
    query: LogPageQuery,
  ): Promise<{ rows: LogRow[]; total: number }> {
    const where: Prisma.logsWhereInput = {
      type: query.type,
      created_at: { gte: query.from, lte: query.to },
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.logs.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.logs.count({ where }),
    ]);

    return { rows, total };
  }
}
