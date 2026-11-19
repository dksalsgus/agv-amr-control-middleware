import { Injectable } from "@nestjs/common";
import { RobotDevice } from "../../state/robot-state";
import { VendorsConnectionsRepository } from "../repositories/vendors-connections.repository";

export type IngestConnection = {
  id: string;
  vendorCode: string;
  protocol: "MQTT" | "REST" | "MODBUS_TCP";
  config: unknown;
  robots: RobotDevice[];
};

/**
 * 수집을 시작할 연결 목록을 DB에서 읽어 수집에 필요한 모양으로 바꾼다.
 */
@Injectable()
export class ConnectionProvider {
  constructor(
    private readonly vendorsConnectionsRepository: VendorsConnectionsRepository,
  ) {}

  async findEnabledConnections(): Promise<IngestConnection[]> {
    const rows =
      await this.vendorsConnectionsRepository.findEnabledWithVendorAndDevices();

    return rows.map((row) => ({
      id: row.id,
      vendorCode: row.vendors.code,
      protocol: row.protocol,
      config: row.config,
      robots: row.vendors_connections_devices
        .filter((device) => device.type !== "PLC")
        .map((device) => ({
          deviceId: device.id,
          connectionId: row.id,
          externalId: device.external_id,
          name: device.name,
          type: device.type as RobotDevice["type"],
        })),
    }));
  }
}
