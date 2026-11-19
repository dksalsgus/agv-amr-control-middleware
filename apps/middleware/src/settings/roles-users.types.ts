import { Prisma } from "@prisma/client";

export type RolesUserWithRoleRow = Prisma.roles_usersGetPayload<{
  include: { roles: true };
}>;
