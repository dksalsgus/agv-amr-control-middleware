import { apiClient } from "../api/api-client";
import { ConnectionStats } from "./monitor.types";

type Response = { windowSec: number; connections: ConnectionStats[] };

export class ConnectionStatsApi {
  /** 연결별 최근 구간 받음·중복·늦음 건수와 유실률 */
  async findAll(): Promise<Response> {
    return await apiClient.get<Response>("/metrics/connections");
  }
}

export const connectionStatsApi = new ConnectionStatsApi();
