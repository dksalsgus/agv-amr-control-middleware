import { Injectable } from "@nestjs/common";
import {
  LogPageQuery,
  LogRow,
  LogsRepository,
} from "../history/logs.repository";

@Injectable()
export class LogsQueryProvider {
  constructor(private readonly logsRepository: LogsRepository) {}

  async findPage(
    query: LogPageQuery,
  ): Promise<{ rows: LogRow[]; total: number }> {
    return await this.logsRepository.findPage(query);
  }
}
