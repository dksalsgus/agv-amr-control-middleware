import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthUser } from "../../auth/auth.types";
import { AuthenticatedRequest } from "../../auth/authenticated-request.types";

/** AuthGuard가 토큰에서 꺼내 둔 사용자 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
