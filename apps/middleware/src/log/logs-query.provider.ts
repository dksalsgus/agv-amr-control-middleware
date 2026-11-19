import { Injectable } from "@nestjs/common";
import { LogsRepository } from "../history/logs.repository";
import { LogPageQuery, LogRow } from "../history/logs.types";

@Injectable()
export class LogsQueryProvider {
  constructor(private readonly logsRepository: LogsRepository) {}

  async findPage(
    query: LogPageQuery,
  ): Promise<{ rows: LogRow[]; total: number }> {
    return await this.logsRepository.findPage(query);
  }
}
