import { Injectable } from "@nestjs/common";
import { PlcPointType } from "../../state/plc-point-state";
import { RobotDevice } from "../../state/robot-state";
import { VendorsConnectionsRepository } from "../../settings/vendors-connections.repository";
import { ConnectionWithDevicesRow } from "../../settings/vendors-connections.types";
import {
  ConnectionProtocol,
  PlcDevice,
  IngestConnection,
  DeviceRow,
} from "./connection.types";

/**
 * 수집할 연결 목록을 읽어 로봇과 PLC 장비로 나눈다.
 * 한 연결에는 로봇과 PLC 중 한 종류만 붙는다고 본다. 로봇 연결은 IngestService, PLC 연결은 PlcIngestService가 맡는다.
 */
@Injectable()
export class IngestConnectionProvider {
  constructor(
    private readonly vendorsConnectionsRepository: VendorsConnectionsRepository,
  ) {}

  async findEnabledConnections(): Promise<IngestConnection[]> {
    const rows =
      await this.vendorsConnectionsRepository.findEnabledWithVendorAndDevices();

    const connections: IngestConnection[] = rows.map((row) =>
      this.toConnection(row),
    );

    return connections;
  }

  /** 꺼졌거나 지워진 연결이면 null */
  async findEnabledConnection(id: string): Promise<IngestConnection | null> {
    const row =
      await this.vendorsConnectionsRepository.findEnabledByIdWithVendorAndDevices(
        id,
      );
    return row ? this.toConnection(row) : null;
  }

  private toConnection(row: ConnectionWithDevicesRow): IngestConnection {
    const robots: RobotDevice[] = [];
    const plcDevices: PlcDevice[] = [];

    for (const device of row.vendors_connections_devices) {
      if (device.type === "PLC") {
        plcDevices.push(this.toPlcDevice(row.id, device));
      } else {
        robots.push(this.toRobot(row.id, device));
      }
    }

    return {
      id: row.id,
      vendorCode: row.vendors.code,
      protocol: row.protocol as ConnectionProtocol,
      version: row.version,
      config: row.config,
      robots,
      plcDevices,
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
