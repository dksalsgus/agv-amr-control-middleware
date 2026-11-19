import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ApiRequestError } from "../api/api-request.error";
import { authApi } from "./auth.api";
import { DEMO_ACCOUNT, NOTICE, REDIRECT_MS } from "./login.constants";
import { LoginFieldErrors, LoginNotice, LoginPhase } from "./login.types";

type LocationState = { from?: string } | null;

const NO_ERRORS: LoginFieldErrors = { username: "", password: "" };

/** 로그인 입력, 검사, 요청, 결과 안내를 다룬다. */
export const useLoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const expired = params.get("reason") === "expired";
  const from =
    (location.state as LocationState)?.from ?? params.get("from") ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginFieldErrors>(NO_ERRORS);
  const [notice, setNotice] = useState<LoginNotice | null>(
    expired ? NOTICE.expired : null,
  );
  const [phase, setPhase] = useState<LoginPhase>("idle");
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const focusAfterRender = useRef<"password" | "notice" | null>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  // 실패하면 입력란이 다시 켜진 뒤에 포커스를 옮긴다.
  useEffect(() => {
    const target =
      focusAfterRender.current === "password" ? passwordRef : noticeRef;
    if (focusAfterRender.current) {
      target.current?.focus();
    }
    focusAfterRender.current = null;
  }, [phase, notice]);

  const validate = (): boolean => {
    const next: LoginFieldErrors = {
      username: username.trim() ? "" : "아이디를 입력하세요.",
      password: password ? "" : "비밀번호를 입력하세요.",
    };
    setErrors(next);
    if (next.username) {
      usernameRef.current?.focus();
    } else if (next.password) {
      passwordRef.current?.focus();
    }
    return !next.username && !next.password;
  };

  const fail = (caught: unknown) => {
    setPhase("idle");
    const unauthorized =
      caught instanceof ApiRequestError && caught.status === 401;
    if (unauthorized) {
      setPassword("");
      setNotice(NOTICE.unauthorized);
      setErrors({ username: "", password: "비밀번호를 다시 입력하세요." });
      focusAfterRender.current = "password";
      return;
    }
    setNotice(NOTICE.unreachable);
    focusAfterRender.current = "notice";
  };

  const submit = async () => {
    if (phase !== "idle" || !validate()) {
      return;
    }
    setNotice(null);
    setPhase("submitting");
    try {
      await authApi.login(username.trim(), password);
    } catch (caught) {
      fail(caught);
      return;
    }
    setPhase("done");
    setNotice(NOTICE.success);
    setTimeout(() => void navigate(from, { replace: true }), REDIRECT_MS);
  };

  const changeUsername = (value: string) => {
    setUsername(value);
    if (errors.username && value) {
      setErrors({ username: "", password: errors.password });
    }
  };

  const changePassword = (value: string) => {
    setPassword(value);
    if (errors.password && value) {
      setErrors({ username: errors.username, password: "" });
    }
  };

  const fillDemo = () => {
    if (phase !== "idle") {
      return;
    }
    setUsername(DEMO_ACCOUNT.username);
    setPassword(DEMO_ACCOUNT.password);
    setErrors(NO_ERRORS);
    submitRef.current?.focus();
  };

  return {
    username,
    password,
    showPassword,
    errors,
    notice,
    phase,
    usernameRef,
    passwordRef,
    noticeRef,
    submitRef,
    changeUsername,
    changePassword,
    toggleShowPassword: () => setShowPassword((shown) => !shown),
    submit,
    fillDemo,
  };
};
