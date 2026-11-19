import { ConnectionSummaryRow } from "../settings/vendors-connections.types";
import { LinkState } from "../state/link-state";
import {
  ModbusConfigDto,
  MqttConfigDto,
  RestConfigDto,
} from "./dto/connection-config.dto";

export type ConfigParts = {
  mqtt?: MqttConfigDto;
  rest?: RestConfigDto;
  modbus?: ModbusConfigDto;
};

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
