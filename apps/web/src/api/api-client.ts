import { tokenStorage } from "../auth/token-storage";
import { ApiRequestError } from "./api-request.error";
import { ApiResult } from "./api.types";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/** 미들웨어 HTTP API. 토큰을 붙이고, 응답 껍데기를 벗겨 data만 돌려준다. */
export class ApiClient {
  private static readonly BASE_PATH = "/api";
  private static readonly LOGIN_PATH = "/login";

  async get<T>(path: string): Promise<T> {
    return await this.request<T>("GET", path, undefined);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return await this.request<T>("POST", path, body);
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    return await this.request<T>("PATCH", path, body);
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return await this.request<T>("PUT", path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return await this.request<T>("DELETE", path, undefined);
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    body: unknown,
  ): Promise<T> {
    const response = await fetch(`${ApiClient.BASE_PATH}${path}`, {
      method,
      headers: this.toHeaders(body !== undefined),
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.status === 401) {
      this.goToLogin();
    }

    // 프록시가 돌려준 502처럼 본문이 JSON이 아니면 상태 코드로 실패를 알린다.
    const result = (await response
      .json()
      .catch(() => null)) as ApiResult<T> | null;
    if (!result) {
      throw new ApiRequestError(response.status, [response.statusText]);
    }
    if (!result.success || !response.ok) {
      throw new ApiRequestError(response.status, this.toMessages(result));
    }

    return result.data as T;
  }

  private toHeaders(hasBody: boolean): Record<string, string> {
    const headers: Record<string, string> = {};
    if (hasBody) {
      headers["Content-Type"] = "application/json";
    }
    const session = tokenStorage.find();
    if (session) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return headers;
  }

  private toMessages(result: ApiResult<unknown>): string[] {
    const message = result.error?.message ?? "요청이 실패했습니다.";
    return Array.isArray(message) ? message : [message];
  }

  /** 토큰이 만료되었거나 잘못되면 로그인 화면으로 보낸다. 로그인 화면의 401(비밀번호 틀림)은 화면이 처리한다. */
  private goToLogin(): void {
    if (window.location.pathname === ApiClient.LOGIN_PATH) {
      return;
    }
    tokenStorage.clear();
    const params = new URLSearchParams({
      reason: "expired",
      from: window.location.pathname,
    });
    window.location.assign(`${ApiClient.LOGIN_PATH}?${params.toString()}`);
  }
}

export const apiClient = new ApiClient();
