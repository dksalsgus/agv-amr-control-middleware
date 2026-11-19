import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AuthUser } from "../auth/auth.types";
import { ConnectionReloadService } from "../ingest/connection-reload.service";
import { VENDOR_PROTOCOLS } from "../ingest/providers/connection.constants";
import { ConnectionsProvider } from "./connections.provider";
import { ConnectionWithLink } from "./connections.types";
import { GetConnectionResponseDto } from "./dto/get-connection.response.dto";
import { GetConnectionsResponseDto } from "./dto/get-connections.response.dto";
import { GetConnectionsItemDto } from "./dto/get-connections.item.dto";
import { PatchConnectionRequestDto } from "./dto/patch-connection.request.dto";
import { PatchConnectionResponseDto } from "./dto/patch-connection.response.dto";
import { PostConnectionRequestDto } from "./dto/post-connection.request.dto";
import { PostConnectionResponseDto } from "./dto/post-connection.response.dto";
import { ConfigParts } from "./connections.types";

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly connectionsProvider: ConnectionsProvider,
    private readonly connectionReloadService: ConnectionReloadService,
  ) {}

  async getConnections(): Promise<GetConnectionsResponseDto> {
    const entries = await this.connectionsProvider.findAll();

    const connections: GetConnectionsItemDto[] = entries.map((entry) =>
      this.toItem(entry),
    );

    return { connections };
  }

  async getConnection(id: string): Promise<GetConnectionResponseDto> {
    const entry = await this.connectionsProvider.findById(id);
    if (!entry) {
      throw new NotFoundException(`연결이 없습니다: ${id}`);
    }

    const item = this.toItem(entry);
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
    user: AuthUser,
  ): Promise<PatchConnectionResponseDto> {
    const entry = await this.connectionsProvider.findById(id);
    if (!entry) {
      throw new NotFoundException(`연결이 없습니다: ${id}`);
    }

    const protocol = request.protocol ?? entry.row.protocol;
    this.checkVendorProtocol(entry.row.vendors, protocol);

    const config = this.resolveConfig(protocol, request, entry.row.config);
    const isProtocolChanged = protocol !== entry.row.protocol;
    if (isProtocolChanged && !config) {
      throw new BadRequestException(
        `프로토콜을 ${protocol}(으)로 바꾸려면 그 config도 보내야 합니다.`,
      );
    }

    const updated = await this.connectionsProvider.update(id, request.version, {
      name: request.name,
      enabled: request.enabled,
      protocol: isProtocolChanged ? protocol : undefined,
      config,
    });
    if (!updated) {
      throw new ConflictException(
        "다른 곳에서 먼저 고쳤습니다. 새로 불러온 뒤 다시 시도하세요.",
      );
    }

    const changes = this.toChangeTexts(entry.row, request, isProtocolChanged);
    const detail = changes.length > 0 ? `(${changes.join(", ")})` : "";
    await this.connectionsProvider.writeChangeLog(
      id,
      `${entry.row.name} 설정 변경${detail} · ${user.username}`,
      user.sub,
    );
    await this.connectionReloadService.reloadConnection(id);
    return { id, version: request.version + 1 };
  }

  async postConnection(
    request: PostConnectionRequestDto,
    user: AuthUser,
  ): Promise<PostConnectionResponseDto> {
    const vendor = await this.connectionsProvider.findVendor(request.vendorId);
    this.checkVendorProtocol(vendor, request.protocol);

    const config = this.resolveConfig(request.protocol, request, {});
    if (!config) {
      throw new BadRequestException(
        `${request.protocol} 연결의 config가 필요합니다.`,
      );
    }

    const created = await this.connectionsProvider.create({
      vendorId: request.vendorId,
      name: request.name,
      protocol: request.protocol,
      enabled: request.enabled ?? true,
      config,
    });
    await this.connectionsProvider.writeChangeLog(
      created.id,
      `${request.name} 연결 추가(${request.protocol}) · ${user.username}`,
      user.sub,
    );
    await this.connectionReloadService.reloadConnection(created.id);
    return created;
  }

  /** 장비가 딸린 연결은 이력이 걸려 있어 지우지 않고 끄도록 안내한다. */
  async deleteConnection(id: string, user: AuthUser): Promise<void> {
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
    await this.connectionsProvider.writeChangeLog(
      id,
      `${entry.row.name} 연결 삭제 · ${user.username}`,
      user.sub,
    );
    await this.connectionReloadService.removeConnection(id);
  }

  /** 이력에 남길 바뀐 항목. 예: ["REST→MQTT", "접속 정보"] */
  private toChangeTexts(
    saved: { name: string; protocol: string; enabled: boolean },
    request: PatchConnectionRequestDto,
    isProtocolChanged: boolean,
  ): string[] {
    const isNameChanged =
      request.name !== undefined && request.name !== saved.name;
    const isEnabledChanged =
      request.enabled !== undefined && request.enabled !== saved.enabled;
    const isConfigSent = [request.mqtt, request.rest, request.modbus].some(
      (part) => part !== undefined,
    );
    const enabledText = request.enabled ? "켬" : "끔";

    return [
      isProtocolChanged ? `${saved.protocol}→${request.protocol}` : null,
      isNameChanged ? `이름 ${saved.name}→${request.name}` : null,
      isEnabledChanged ? enabledText : null,
      isConfigSent && !isProtocolChanged ? "접속 정보" : null,
    ].filter((text): text is string => text !== null);
  }

  /** 장비가 보내지 않거나 어댑터가 읽지 못하는 프로토콜이면 400 */
  private checkVendorProtocol(
    vendor: { code: string; name: string },
    protocol: string,
  ): void {
    const supported: readonly string[] = VENDOR_PROTOCOLS[vendor.code] ?? [];
    if (supported.includes(protocol)) {
      return;
    }

    throw new BadRequestException(
      `${vendor.name} 장비는 ${protocol} 연결을 지원하지 않습니다. 지원: ${supported.join(", ") || "없음"}`,
    );
  }

  /** 보낸 config가 protocol과 맞는지 확인하고 저장할 모양으로 만든다. */
  private resolveConfig(
    protocol: string,
    parts: ConfigParts,
    savedConfig: unknown,
  ): Record<string, unknown> | undefined {
    const providedCount = [parts.mqtt, parts.rest, parts.modbus].filter(
      (part) => part !== undefined,
    ).length;
    if (providedCount === 0) {
      return undefined;
    }

    const config = this.toConfig(protocol, parts, savedConfig);
    if (providedCount > 1 || !config) {
      throw new BadRequestException(
        `${protocol} 연결에는 그에 맞는 config 하나만 보낼 수 있습니다.`,
      );
    }

    return config;
  }

  /** MQTT password를 빼고 보내면 저장된 값을 유지한다. */
  private toConfig(
    protocol: string,
    parts: ConfigParts,
    savedConfig: unknown,
  ): Record<string, unknown> | null {
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

  private toItem(entry: ConnectionWithLink): GetConnectionsItemDto {
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
