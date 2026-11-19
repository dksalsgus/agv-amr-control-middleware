import { ConnectionWithDevicesRow } from "../../settings/vendors-connections.repository";
import { PlcPoint } from "../../state/plc-point-state";
import { RobotDevice } from "../../state/robot-state";
import { CONNECTION_PROTOCOLS } from "./connection.constants";

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
  /** 설정이 바뀔 때마다 오른다. 다르면 다시 붙는다. */
  version: number;
  config: unknown;
  robots: RobotDevice[];
  plcDevices: PlcDevice[];
};

export type DeviceRow =
  ConnectionWithDevicesRow["vendors_connections_devices"][number];
