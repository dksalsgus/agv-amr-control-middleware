import { vendors_connections_devices_plc_points_events } from "@prisma/client";

export type PlcPointEventRow = vendors_connections_devices_plc_points_events;

export type PlcPointEventPageQuery = {
  pointId: string;
  from?: Date;
  to?: Date;
  skip: number;
  take: number;
};
