import { apiClient } from "../api/api-client";
import { ConnectionItem } from "./connections.types";

export class ConnectionsApi {
  async findAll(): Promise<ConnectionItem[]> {
    const response = await apiClient.get<{ connections: ConnectionItem[] }>(
      "/connections",
    );
    return response.connections;
  }
}

export const connectionsApi = new ConnectionsApi();
