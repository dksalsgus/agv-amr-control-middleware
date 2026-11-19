import { Injectable } from "@nestjs/common";
import { logs, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type LogRow = logs;

export type LogPageQuery = {
  type?: string;
  from?: Date;
  to?: Date;
  skip: number;
  take: number;
};

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
