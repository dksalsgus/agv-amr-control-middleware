import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RolesUserWithRoleRow } from "./roles-users.types";

@Injectable()
export class RolesUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsernameWithRole(
    username: string,
  ): Promise<RolesUserWithRoleRow | null> {
    return await this.prisma.roles_users.findUnique({
      where: { username },
      include: { roles: true },
    });
  }
}
