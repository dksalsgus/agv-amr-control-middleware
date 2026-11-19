import { apiClient } from "../api/api-client";
import { LoginResponse, LoginSession } from "./auth.types";
import { tokenStorage } from "./token-storage";

export class AuthApi {
  async login(username: string, password: string): Promise<LoginSession> {
    const response = await apiClient.post<LoginResponse>("/auth/login", {
      username,
      password,
    });
    const session: LoginSession = {
      accessToken: response.accessToken,
      username: response.username,
      roles: response.roles,
      expiresAt: Date.now() + response.expiresIn * 1000,
    };
    tokenStorage.save(session);
    return session;
  }

  logout(): void {
    tokenStorage.clear();
  }
}

export const authApi = new AuthApi();
