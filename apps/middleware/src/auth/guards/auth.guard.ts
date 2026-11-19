import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../auth.constants";
import { AuthService } from "../auth.service";
import { AuthenticatedRequest } from "../authenticated-request.types";

/** 모든 HTTP API에 Bearer 토큰을 요구한다. WebSocket은 hello의 token으로 따로 확인한다. */
@Injectable()
export class AuthGuard implements CanActivate {
  private static readonly BEARER_PREFIX = "Bearer ";

  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== "http") {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    request.user = await this.authService.authenticate(
      this.toToken(request.headers.authorization),
    );
    return true;
  }

  private toToken(header: string | undefined): string | undefined {
    if (!header?.startsWith(AuthGuard.BEARER_PREFIX)) {
      return undefined;
    }
    return header.slice(AuthGuard.BEARER_PREFIX.length);
  }
}
