import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiRequestError } from "../api/api-request.error";
import { authApi } from "../auth/auth.api";

type LocationState = { from?: string } | null;

/** 로그인 흐름만 있는 임시 화면. 디자인(docs/design)이 들어오면 그대로 옮긴다. */
export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await authApi.login(username, password);
      const state = location.state as LocationState;
      await navigate(state?.from ?? "/", { replace: true });
    } catch (caught) {
      const isUnauthorized =
        caught instanceof ApiRequestError && caught.status === 401;
      setError(
        isUnauthorized
          ? "아이디 또는 비밀번호가 맞지 않습니다."
          : "서버에 연결하지 못했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)}>
      <h1>로그인</h1>
      <input
        aria-label="아이디"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        autoComplete="username"
      />
      <input
        aria-label="비밀번호"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
      />
      <button type="submit" disabled={submitting}>
        로그인
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
};
