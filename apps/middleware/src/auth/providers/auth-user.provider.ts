import { Injectable } from "@nestjs/common";
import { verify } from "argon2";
import { UsersRepository } from "../../settings/users.repository";
import { ROLE_CODES, RoleCode } from "../role";
import { AuthUser } from "../auth.types";

@Injectable()
export class AuthUserProvider {
  constructor(private readonly usersRepository: UsersRepository) {}

  /** 아이디가 없거나 비밀번호가 틀리면 null */
  async findByCredentials(
    username: string,
    password: string,
  ): Promise<AuthUser | null> {
    const row = await this.usersRepository.findByUsernameWithRoles(username);
    if (!row) {
      return null;
    }

    const isValidPassword = await verify(row.password_hash, password);
    if (!isValidPassword) {
      return null;
    }

    return {
      sub: row.id,
      username: row.username,
      roles: row.user_roles.map((userRole) => this.toRole(userRole.roles.code)),
    };
  }

  private toRole(code: string): RoleCode {
    const role = ROLE_CODES.find((item) => item === code);
    if (!role) {
      throw new Error(`알 수 없는 역할입니다: ${code}`);
    }
    return role;
  }
}
