import { Prisma } from "@prisma/client";

export type UserWithRolesRow = Prisma.usersGetPayload<{
  include: { user_roles: { include: { roles: true } } };
}>;
