import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { authConfig } from "../../config/auth.config";
import { ROLE_CODES } from "../role";
import { AuthUser } from "../auth.types";

@Injectable()
export class AuthTokenProvider {
  constructor(
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
    private readonly jwtService: JwtService,
  ) {}

  async sign(user: AuthUser): Promise<string> {
    return await this.jwtService.signAsync(
      { sub: user.sub, username: user.username, roles: user.roles },
      { secret: this.config.jwtSecret, expiresIn: this.config.tokenTtlSeconds },
    );
  }

  /** 서명이 틀렸거나 만료됐으면 null */
  async verify(token: string): Promise<AuthUser | null> {
    try {
      const payload = await this.jwtService.verifyAsync<AuthUser>(token, {
        secret: this.config.jwtSecret,
      });
      const isValidRoles =
        Array.isArray(payload.roles) &&
        payload.roles.every((role) => ROLE_CODES.includes(role));
      if (!isValidRoles) {
        return null;
      }

      return {
        sub: payload.sub,
        username: payload.username,
        roles: payload.roles,
      };
    } catch {
      return null;
    }
  }

  async getTtlSeconds(): Promise<number> {
    return this.config.tokenTtlSeconds;
  }
}
