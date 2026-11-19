import { UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthUser } from "./auth.types";
import { AuthTokenProvider } from "./providers/auth-token.provider";
import { AuthUserProvider } from "./providers/auth-user.provider";

describe("AuthService.login", () => {
  const setup = (user: AuthUser | null) => {
    const authUserProvider = {
      findByCredentials: jest.fn().mockResolvedValue(user),
    } as unknown as AuthUserProvider;
    const authTokenProvider = {
      sign: jest.fn().mockResolvedValue("token"),
      getTtlSeconds: jest.fn().mockResolvedValue(60),
    } as unknown as AuthTokenProvider;
    return new AuthService(authUserProvider, authTokenProvider);
  };

  it("맞는 계정이면 토큰과 역할을 준다", async () => {
    const service = setup({ sub: "u1", username: "admin", role: "ADMIN" });

    await expect(
      service.login({ username: "admin", password: "admin1234" }),
    ).resolves.toEqual({
      accessToken: "token",
      expiresIn: 60,
      username: "admin",
      role: "ADMIN",
    });
  });

  it("틀린 계정이면 401", async () => {
    const service = setup(null);

    await expect(
      service.login({ username: "admin", password: "x" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
