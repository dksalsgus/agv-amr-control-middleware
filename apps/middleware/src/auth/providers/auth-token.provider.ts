import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { authConfig } from "../../config/auth.config";
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
      { sub: user.sub, username: user.username, role: user.role },
      { secret: this.config.jwtSecret, expiresIn: this.config.tokenTtlSeconds },
    );
  }

  async getTtlSeconds(): Promise<number> {
    return this.config.tokenTtlSeconds;
  }
}
