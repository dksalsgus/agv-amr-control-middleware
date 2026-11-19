import { Injectable } from "@nestjs/common";
import { LogRow } from "../history/logs.types";
import { GetLogsQueryDto } from "./dto/get-logs.request.dto";
import { GetLogsResponseDto } from "./dto/get-logs.response.dto";
import { GetLogsItemDto } from "./dto/get-logs.item.dto";
import { LogsQueryProvider } from "./logs-query.provider";

@Injectable()
export class LogsService {
  constructor(private readonly logsQueryProvider: LogsQueryProvider) {}

  async getLogs(query: GetLogsQueryDto): Promise<GetLogsResponseDto> {
    const { rows, total } = await this.logsQueryProvider.findPage({
      type: query.type,
      from: query.from,
      to: query.to,
      skip: query.skip,
      take: query.size,
    });

    const items: GetLogsItemDto[] = [];
    for (const row of rows) {
      items.push(await this.toItem(row));
    }

    return { items, page: query.page, size: query.size, total };
  }

  private async toItem(row: LogRow): Promise<GetLogsItemDto> {
    return {
      id: row.id.toString(),
      type: row.type,
      level: row.level,
      targetType: row.target_type,
      targetId: row.target_id,
      message: row.message,
      createdAt: row.created_at.toISOString(),
    };
  }
}
