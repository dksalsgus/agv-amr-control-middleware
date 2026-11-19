import { apiClient } from "../api/api-client";
import { LogFilter, LogPage, LogQuery } from "./logs.types";
import { toLogsPath } from "./logs.util";

export class LogsApi {
  async findPage(query: LogQuery): Promise<LogPage> {
    return await apiClient.get<LogPage>(toLogsPath(query));
  }

  /** 건수만 필요할 때. 한 건만 받아 total을 읽는다. */
  async count(filter: LogFilter): Promise<number> {
    const page = await this.findPage({ filter, page: 1, size: 1 });
    return page.total;
  }
}

export const logsApi = new LogsApi();
