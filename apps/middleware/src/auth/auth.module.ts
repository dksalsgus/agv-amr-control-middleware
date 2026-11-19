import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { SettingsModule } from "../settings/settings.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthTokenProvider } from "./providers/auth-token.provider";
import { AuthUserProvider } from "./providers/auth-user.provider";

@Module({
  imports: [SettingsModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, AuthUserProvider, AuthTokenProvider],
})
export class AuthModule {}
