import { Prisma } from "@prisma/client";
import {
  WITH_VENDOR_AND_DEVICE_COUNT,
  WITH_VENDOR_AND_DEVICES,
} from "./vendors-connections.constants";

export type ConnectionWithDevicesRow = Prisma.vendors_connectionsGetPayload<{
  include: typeof WITH_VENDOR_AND_DEVICES;
}>;

export type ConnectionSummaryRow = Prisma.vendors_connectionsGetPayload<{
  include: typeof WITH_VENDOR_AND_DEVICE_COUNT;
}>;
