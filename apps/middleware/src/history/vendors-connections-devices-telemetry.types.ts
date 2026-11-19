import { vendors_connections_devices_telemetry } from "@prisma/client";

export type TelemetryRow = vendors_connections_devices_telemetry;

export type TelemetryPageQuery = {
  deviceId: string;
  from?: Date;
  to?: Date;
  skip: number;
  take: number;
};
