import { Injectable } from "@nestjs/common";
import { PlcPoint, PlcPointType } from "../../state/plc-point-state";
import { RobotDevice } from "../../state/robot-state";
import {
  ConnectionWithDevicesRow,
  VendorsConnectionsRepository,
} from "../repositories/vendors-connections.repository";

/** vendors_connections.protocol 컬럼(varchar)의 허용값 */
export const CONNECTION_PROTOCOLS = ["MQTT", "REST", "MODBUS_TCP"] as const;

export type ConnectionProtocol = (typeof CONNECTION_PROTOCOLS)[number];

export type PlcDevice = {
  deviceId: string;
  externalId: string;
  points: PlcPoint[];
};

export type IngestConnection = {
  id: string;
  vendorCode: string;
  protocol: ConnectionProtocol;
  config: unknown;
  robots: RobotDevice[];
  plcDevices: PlcDevice[];
};

type DeviceRow =
  ConnectionWithDevicesRow["vendors_connections_devices"][number];

/** 수집할 연결 목록을 읽어 로봇과 PLC 장비로 나눈다. */
@Injectable()
export class ConnectionProvider {
  constructor(
    private readonly vendorsConnectionsRepository: VendorsConnectionsRepository,
  ) {}

  async findEnabledConnections(): Promise<IngestConnection[]> {
    const rows =
      await this.vendorsConnectionsRepository.findEnabledWithVendorAndDevices();

    const connections: IngestConnection[] = [];
    for (const row of rows) {
      connections.push(await this.toConnection(row));
    }

    return connections;
  }

  private async toConnection(
    row: ConnectionWithDevicesRow,
  ): Promise<IngestConnection> {
    const robots: RobotDevice[] = [];
    const plcDevices: PlcDevice[] = [];

    for (const device of row.vendors_connections_devices) {
      if (device.type === "PLC") {
        plcDevices.push(await this.toPlcDevice(row.id, device));
      } else {
        robots.push(await this.toRobot(row.id, device));
      }
    }

    return {
      id: row.id,
      vendorCode: row.vendors.code,
      protocol: row.protocol as ConnectionProtocol,
      config: row.config,
      robots,
      plcDevices,
    };
  }

  private async toRobot(
    connectionId: string,
    device: DeviceRow,
  ): Promise<RobotDevice> {
    return {
      deviceId: device.id,
      connectionId,
      externalId: device.external_id,
      name: device.name,
      type: device.type as RobotDevice["type"],
    };
  }

  private async toPlcDevice(
    connectionId: string,
    device: DeviceRow,
  ): Promise<PlcDevice> {
    return {
      deviceId: device.id,
      externalId: device.external_id,
      points: device.vendors_connections_devices_plc_points.map((point) => ({
        pointId: point.id,
        deviceId: device.id,
        connectionId,
        pointNo: point.point_no,
        name: point.name,
        type: point.type as PlcPointType,
        normalValue: point.normal_value,
        alarmOnAbnormal: point.alarm_on_abnormal,
      })),
    };
  }
}
