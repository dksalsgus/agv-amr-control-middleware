import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UserWithRolesRow } from "./users.types";

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsernameWithRoles(
    username: string,
  ): Promise<UserWithRolesRow | null> {
    return await this.prisma.users.findUnique({
      where: { username },
      include: { user_roles: { include: { roles: true } } },
    });
  }
}
