import { apiClient } from "../api/api-client";
import {
  ConnectionDetail,
  ConnectionItem,
  ConnectionWriteBody,
  Protocol,
} from "./connections.types";

type SaveResult = { id: string; version: number };

export class ConnectionsApi {
  async findAll(): Promise<ConnectionItem[]> {
    const response = await apiClient.get<{ connections: ConnectionItem[] }>(
      "/connections",
    );
    return response.connections;
  }

  async findOne(id: string): Promise<ConnectionDetail> {
    return await apiClient.get<ConnectionDetail>(`/connections/${id}`);
  }

  /** version이 서버와 다르면 409 */
  async update(
    id: string,
    version: number,
    body: ConnectionWriteBody | { enabled: boolean },
  ): Promise<SaveResult> {
    return await apiClient.patch<SaveResult>(
      `/connections/${id}`,
      Object.assign({ version }, body),
    );
  }

  async create(
    vendorId: string,
    protocol: Protocol,
    body: ConnectionWriteBody,
  ): Promise<SaveResult> {
    return await apiClient.post<SaveResult>(
      "/connections",
      Object.assign({ vendorId, protocol }, body),
    );
  }

  /** 장비가 딸린 연결이면 409 */
  async remove(id: string): Promise<void> {
    await apiClient.delete<null>(`/connections/${id}`);
  }
}

export const connectionsApi = new ConnectionsApi();
