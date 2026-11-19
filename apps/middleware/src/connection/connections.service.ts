import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ConnectionsProvider,
  ConnectionWithLink,
} from "./connections.provider";
import { GetConnectionResponseDto } from "./dto/get-connection.response.dto";
import {
  GetConnectionsItemDto,
  GetConnectionsResponseDto,
} from "./dto/get-connections.response.dto";
import { PatchConnectionRequestDto } from "./dto/patch-connection.request.dto";
import { PatchConnectionResponseDto } from "./dto/patch-connection.response.dto";
import { PostConnectionRequestDto } from "./dto/post-connection.request.dto";
import { PostConnectionResponseDto } from "./dto/post-connection.response.dto";

type ConfigParts = {
  mqtt?: object;
  rest?: object;
  modbus?: object;
};

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

  async getConnection(id: string): Promise<GetConnectionResponseDto> {
    const entry = await this.connectionsProvider.findById(id);
    if (!entry) {
      throw new NotFoundException(`연결이 없습니다: ${id}`);
    }

    const item = await this.toItem(entry);
    const config = { ...(entry.row.config as Record<string, unknown>) };
    const hasPassword = typeof config.password === "string";
    delete config.password;

    return { ...item, config, hasPassword };
  }

  async patchConnection(
    id: string,
    request: PatchConnectionRequestDto,
  ): Promise<PatchConnectionResponseDto> {
    const entry = await this.connectionsProvider.findById(id);
    if (!entry) {
      throw new NotFoundException(`연결이 없습니다: ${id}`);
    }

    const config = await this.resolveConfig(
      entry.row.protocol,
      request,
      entry.row.config,
    );
    const updated = await this.connectionsProvider.update(id, request.version, {
      name: request.name,
      enabled: request.enabled,
      config,
    });
    if (!updated) {
      throw new ConflictException(
        "다른 곳에서 먼저 고쳤습니다. 새로 불러온 뒤 다시 시도하세요.",
      );
    }

    return { id, version: request.version + 1 };
  }

  async postConnection(
    request: PostConnectionRequestDto,
  ): Promise<PostConnectionResponseDto> {
    const config = await this.resolveConfig(request.protocol, request, {});
    if (!config) {
      throw new BadRequestException(
        `${request.protocol} 연결의 config가 필요합니다.`,
      );
    }

    return await this.connectionsProvider.create({
      vendorId: request.vendorId,
      name: request.name,
      protocol: request.protocol,
      enabled: request.enabled ?? true,
      config,
    });
  }

  /** 장비가 딸린 연결은 이력이 걸려 있어 지우지 않고 끄도록 안내한다. */
  async deleteConnection(id: string): Promise<void> {
    const entry = await this.connectionsProvider.findById(id);
    if (!entry) {
      throw new NotFoundException(`연결이 없습니다: ${id}`);
    }

    if (entry.row._count.vendors_connections_devices > 0) {
      throw new ConflictException(
        "장비가 있는 연결은 지울 수 없습니다. enabled를 false로 바꿔 끄세요.",
      );
    }

    await this.connectionsProvider.delete(id);
  }

  /** 보낸 config가 protocol과 맞는지 확인하고 저장할 모양으로 만든다. */
  private async resolveConfig(
    protocol: string,
    parts: ConfigParts,
    savedConfig: unknown,
  ): Promise<Record<string, unknown> | undefined> {
    const candidates: [string, object | undefined][] = [
      ["MQTT", parts.mqtt],
      ["REST", parts.rest],
      ["MODBUS_TCP", parts.modbus],
    ];
    const provided = candidates.filter(([, config]) => config !== undefined);
    if (provided.length === 0) {
      return undefined;
    }

    if (provided.length > 1 || provided[0][0] !== protocol) {
      throw new BadRequestException(
        `${protocol} 연결에는 그에 맞는 config 하나만 보낼 수 있습니다.`,
      );
    }

    const config: Record<string, unknown> = { ...provided[0][1] };
    if (protocol === "MQTT") {
      const saved = savedConfig as { password?: string | null };
      config.username = config.username ?? null;
      config.password = config.password ?? saved.password ?? null;
    }

    return config;
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
