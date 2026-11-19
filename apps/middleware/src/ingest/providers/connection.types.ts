import { PlcPoint } from "../../state/plc-point-state";
import { RobotDevice } from "../../state/robot-state";
import { CONNECTION_PROTOCOLS } from "./connection.constants";
import { ConnectionWithDevicesRow } from "../../settings/vendors-connections.types";

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

export type DeviceRow =
  ConnectionWithDevicesRow["vendors_connections_devices"][number];
