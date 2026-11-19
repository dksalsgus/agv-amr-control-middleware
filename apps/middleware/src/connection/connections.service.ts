import { Injectable } from "@nestjs/common";
import {
  ConnectionsProvider,
  ConnectionWithLink,
} from "./connections.provider";
import {
  GetConnectionsItemDto,
  GetConnectionsResponseDto,
} from "./dto/get-connections.response.dto";

@Injectable()
export class ConnectionsService {
  constructor(private readonly connectionsProvider: ConnectionsProvider) {}

  async getConnections(): Promise<GetConnectionsResponseDto> {
    const entries = await this.connectionsProvider.findAll();

    const connections: GetConnectionsItemDto[] = [];
    for (const entry of entries) {
      connections.push(await this.toItem(entry));
    }

    return { connections };
  }

  private async toItem(
    entry: ConnectionWithLink,
  ): Promise<GetConnectionsItemDto> {
    const { row, link } = entry;

    return {
      id: row.id,
      name: row.name,
      vendorCode: row.vendors.code,
      vendorName: row.vendors.name,
      protocol: row.protocol,
      enabled: row.enabled,
      version: row.version,
      deviceCount: row._count.vendors_connections_devices,
      linkStatus: link?.status ?? "UNKNOWN",
      linkChangedAt: link?.changedAt?.toISOString() ?? null,
    };
  }
}
