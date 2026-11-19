import { Prisma } from "@prisma/client";

export const WITH_VENDOR_AND_DEVICES = {
  vendors: true,
  vendors_connections_devices: {
    where: { enabled: true },
    include: { vendors_connections_devices_plc_points: true },
  },
} satisfies Prisma.vendors_connectionsInclude;

export const WITH_VENDOR_AND_DEVICE_COUNT = {
  vendors: true,
  _count: { select: { vendors_connections_devices: true } },
} satisfies Prisma.vendors_connectionsInclude;
