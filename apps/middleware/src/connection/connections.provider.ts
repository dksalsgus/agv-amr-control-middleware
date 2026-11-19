import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  ConnectionSummaryRow,
  VendorsConnectionsRepository,
} from "../settings/vendors-connections.repository";
import { VendorsRepository } from "../settings/vendors.repository";
import { LinkState } from "../state/link-state";
import { LinkStateRepository } from "../state/link-state.repository";

export type ConnectionChanges = {
  name?: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
};

export type NewConnection = {
  vendorId: string;
  name: string;
  protocol: string;
  enabled: boolean;
  config: Record<string, unknown>;
};

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
    private readonly vendorsRepository: VendorsRepository,
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

  async findById(id: string): Promise<ConnectionWithLink | null> {
    const row = await this.vendorsConnectionsRepository.findByIdWithVendor(id);
    if (!row) {
      return null;
    }

    const link = await this.linkStateRepository.findById(row.id);
    return { row, link: link ?? null };
  }

  /** version이 맞을 때만 고친다. 고쳤으면 true. 이름이 겹치면 409 */
  async update(
    id: string,
    version: number,
    changes: ConnectionChanges,
  ): Promise<boolean> {
    try {
      const count = await this.vendorsConnectionsRepository.updateIfVersion(
        id,
        version,
        {
          name: changes.name,
          enabled: changes.enabled,
          config: changes.config as Prisma.InputJsonObject | undefined,
        },
      );
      return count > 0;
    } catch (error) {
      await this.throwIfDuplicateName(error, changes.name);
      throw error;
    }
  }

  /** 없는 제조사면 400, 이름이 겹치면 409 */
  async create(
    connection: NewConnection,
  ): Promise<{ id: string; version: number }> {
    const vendor = await this.vendorsRepository.findById(connection.vendorId);
    if (!vendor) {
      throw new BadRequestException(
        `없는 제조사입니다: ${connection.vendorId}`,
      );
    }

    try {
      return await this.vendorsConnectionsRepository.create({
        vendors_id: connection.vendorId,
        name: connection.name,
        protocol: connection.protocol,
        enabled: connection.enabled,
        config: connection.config as Prisma.InputJsonObject,
      });
    } catch (error) {
      await this.throwIfDuplicateName(error, connection.name);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await this.vendorsConnectionsRepository.deleteById(id);
  }

  private async throwIfDuplicateName(
    error: unknown,
    name: string | undefined,
  ): Promise<void> {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException(`이미 있는 연결 이름입니다: ${name}`);
    }
  }
}
