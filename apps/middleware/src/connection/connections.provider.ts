import { Injectable } from "@nestjs/common";
import {
  ConnectionSummaryRow,
  VendorsConnectionsRepository,
} from "../settings/vendors-connections.repository";
import { LinkState } from "../state/link-state";
import { LinkStateRepository } from "../state/link-state.repository";

export type ConnectionWithLink = {
  row: ConnectionSummaryRow;
  link: LinkState | null;
};

/** 연결 설정(DB)과 연결 상태(메모리)를 합친다. */
@Injectable()
export class ConnectionsProvider {
  constructor(
    private readonly vendorsConnectionsRepository: VendorsConnectionsRepository,
    private readonly linkStateRepository: LinkStateRepository,
  ) {}

  async findAll(): Promise<ConnectionWithLink[]> {
    const rows = await this.vendorsConnectionsRepository.findAllWithVendor();

    const connections: ConnectionWithLink[] = [];
    for (const row of rows) {
      const link = await this.linkStateRepository.findById(row.id);
      connections.push({ row, link: link ?? null });
    }

    return connections;
  }
}
