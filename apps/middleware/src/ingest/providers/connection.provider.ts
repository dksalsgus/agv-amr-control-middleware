import { Injectable } from "@nestjs/common";
import { PlcPoint, PlcPointType } from "../../state/plc-point-state";
import { RobotDevice } from "../../state/robot-state";
import { VendorsConnectionsRepository } from "../repositories/vendors-connections.repository";

export type PlcDevice = {
  deviceId: string;
  externalId: string;
  points: PlcPoint[];
};

/** vendors_connections.protocol 컬럼(varchar)의 허용값 */
export const CONNECTION_PROTOCOLS = ["MQTT", "REST", "MODBUS_TCP"] as const;

export type ConnectionProtocol = (typeof CONNECTION_PROTOCOLS)[number];

export type IngestConnection = {
  id: string;
  vendorCode: string;
  protocol: ConnectionProtocol;
  config: unknown;
  robots: RobotDevice[];
  plcDevices: PlcDevice[];
};

type ConnectionRow = Awaited<
  ReturnType<VendorsConnectionsRepository["findEnabledWithVendorAndDevices"]>
>[number];

type DeviceRow = ConnectionRow["vendors_connections_devices"][number];

/**
 * 수집을 시작할 연결 목록을 DB에서 읽어 수집에 필요한 모양으로 바꾼다.
 * 장비는 로봇(AMR, AGV)과 PLC로 나눈다.
 */
@Injectable()
export class ConnectionProvider {
  constructor(
    private readonly vendorsConnectionsRepository: VendorsConnectionsRepository,
  ) {}

  async findEnabledConnections(): Promise<IngestConnection[]> {
    const rows =
      await this.vendorsConnectionsRepository.findEnabledWithVendorAndDevices();

    return rows.map((row) => this.toConnection(row));
  }

  private toConnection(row: ConnectionRow): IngestConnection {
    const devices = row.vendors_connections_devices;

    return {
      id: row.id,
      vendorCode: row.vendors.code,
      protocol: row.protocol as ConnectionProtocol,
      config: row.config,
      robots: devices
        .filter((device) => device.type !== "PLC")
        .map((device) => this.toRobot(row.id, device)),
      plcDevices: devices
        .filter((device) => device.type === "PLC")
        .map((device) => this.toPlcDevice(row.id, device)),
    };
  }

  private toRobot(connectionId: string, device: DeviceRow): RobotDevice {
    return {
      deviceId: device.id,
      connectionId,
      externalId: device.external_id,
      name: device.name,
      type: device.type as RobotDevice["type"],
    };
  }

  private toPlcDevice(connectionId: string, device: DeviceRow): PlcDevice {
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
