import { LinkState } from "../state/link-state";
import { ModbusConfigDto } from "./dto/modbus-config.dto";
import { RestConfigDto } from "./dto/rest-config.dto";
import { MqttConfigDto } from "./dto/mqtt-config.dto";
import { ConnectionSummaryRow } from "../settings/vendors-connections.types";

export type ConfigParts = {
  mqtt?: MqttConfigDto;
  rest?: RestConfigDto;
  modbus?: ModbusConfigDto;
};

export type ConnectionChanges = {
  name?: string;
  enabled?: boolean;
  protocol?: string;
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
