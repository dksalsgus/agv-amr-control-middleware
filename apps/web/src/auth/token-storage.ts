import { LoginSession } from "./auth.types";

/** 로그인 정보를 브라우저에 둔다. 저장소가 막힌 환경(사생활 보호 창)에서도 화면은 동작해야 해서 예외를 삼킨다. */
export class TokenStorage {
  private static readonly KEY = "agv-control.session";

  find(): LoginSession | null {
    try {
      const raw = window.localStorage.getItem(TokenStorage.KEY);
      if (!raw) {
        return null;
      }
      const session = JSON.parse(raw) as LoginSession;
      if (session.expiresAt <= Date.now()) {
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  save(session: LoginSession): void {
    try {
      window.localStorage.setItem(TokenStorage.KEY, JSON.stringify(session));
    } catch {
      // 저장하지 못하면 새로고침 때 다시 로그인한다.
    }
  }

  clear(): void {
    try {
      window.localStorage.removeItem(TokenStorage.KEY);
    } catch {
      // 지울 것이 없거나 저장소가 막힌 경우
    }
  }
}

export const tokenStorage = new TokenStorage();
