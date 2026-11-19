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
    const service = setup({ sub: "u1", username: "admin", roles: ["ADMIN"] });

    await expect(
      service.login({ username: "admin", password: "admin1234" }),
    ).resolves.toEqual({
      accessToken: "token",
      expiresIn: 60,
      username: "admin",
      roles: ["ADMIN"],
    });
  });

  it("틀린 계정이면 401", async () => {
    const service = setup(null);

    await expect(
      service.login({ username: "admin", password: "x" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe("AuthService.authenticate", () => {
  const setup = (user: AuthUser | null) => {
    const authTokenProvider = {
      verify: jest.fn().mockResolvedValue(user),
    } as unknown as AuthTokenProvider;
    return new AuthService({} as AuthUserProvider, authTokenProvider);
  };

  it("토큰이 없거나 틀리면 401", async () => {
    await expect(setup(null).authenticate(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(setup(null).authenticate("bad")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("맞는 토큰이면 사용자를 돌려준다", async () => {
    const user: AuthUser = { sub: "u1", username: "viewer", roles: ["VIEWER"] };

    await expect(setup(user).authenticate("good")).resolves.toEqual(user);
  });
});
