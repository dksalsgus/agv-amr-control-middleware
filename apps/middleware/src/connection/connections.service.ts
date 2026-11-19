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
import {
  ModbusConfigDto,
  MqttConfigDto,
  RestConfigDto,
} from "./dto/connection-config.dto";
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
  mqtt?: MqttConfigDto;
  rest?: RestConfigDto;
  modbus?: ModbusConfigDto;
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
    const savedConfig = entry.row.config as Record<string, unknown>;
    const config = Object.fromEntries(
      Object.entries(savedConfig).filter(([key]) => key !== "password"),
    );

    return {
      id: item.id,
      name: item.name,
      vendorCode: item.vendorCode,
      vendorName: item.vendorName,
      protocol: item.protocol,
      enabled: item.enabled,
      version: item.version,
      deviceCount: item.deviceCount,
      config,
      hasPassword: typeof savedConfig.password === "string",
      linkStatus: item.linkStatus,
      linkChangedAt: item.linkChangedAt,
    };
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
  /** 프로토콜에 맞는 config 하나만 받는다. 없으면 undefined */
  private async resolveConfig(
    protocol: string,
    parts: ConfigParts,
    savedConfig: unknown,
  ): Promise<Record<string, unknown> | undefined> {
    const providedCount = [parts.mqtt, parts.rest, parts.modbus].filter(
      (part) => part !== undefined,
    ).length;
    if (providedCount === 0) {
      return undefined;
    }

    const config = await this.toConfig(protocol, parts, savedConfig);
    if (providedCount > 1 || !config) {
      throw new BadRequestException(
        `${protocol} 연결에는 그에 맞는 config 하나만 보낼 수 있습니다.`,
      );
    }

    return config;
  }

  /** MQTT password를 빼고 보내면 저장된 값을 유지한다. */
  private async toConfig(
    protocol: string,
    parts: ConfigParts,
    savedConfig: unknown,
  ): Promise<Record<string, unknown> | null> {
    if (protocol === "MQTT" && parts.mqtt) {
      const saved = savedConfig as { password?: string | null };
      return {
        url: parts.mqtt.url,
        topicPattern: parts.mqtt.topicPattern,
        qos: parts.mqtt.qos,
        username: parts.mqtt.username ?? null,
        password: parts.mqtt.password ?? saved.password ?? null,
      };
    }

    if (protocol === "REST" && parts.rest) {
      return {
        baseUrl: parts.rest.baseUrl,
        pollIntervalMs: parts.rest.pollIntervalMs,
        mode: parts.rest.mode,
        timeoutMs: parts.rest.timeoutMs,
      };
    }

    if (protocol === "MODBUS_TCP" && parts.modbus) {
      return {
        host: parts.modbus.host,
        port: parts.modbus.port,
        unitId: parts.modbus.unitId,
        pollIntervalMs: parts.modbus.pollIntervalMs,
        baseAddress: parts.modbus.baseAddress,
        blockSize: parts.modbus.blockSize,
      };
    }

    return null;
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
