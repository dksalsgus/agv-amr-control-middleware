import { CSSProperties, FormEvent, KeyboardEvent } from "react";
import { FieldError } from "../auth/field-error";
import { DEMO_ACCOUNT } from "../auth/login.constants";
import { LoginNotice } from "../auth/login-notice";
import { useLoginForm } from "../auth/use-login-form";
import { Icon } from "../components/icon";
import "../styles/login.css";

/** 로그인 화면. 디자인 기준은 docs/design/login.html */
export const LoginPage = () => {
  const form = useLoginForm();
  const busy = form.phase !== "idle";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void form.submit();
  };

  const enterToSubmit = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void form.submit();
    }
  };

  return (
    <div className="login-app" data-page="login">
      <main className="login-main">
        <div className="login-wrap">
          <section className="login-card" aria-labelledby="brandTitle">
            <div className="brand">
              <svg
                width="40"
                height="40"
                viewBox="0 0 26 26"
                aria-hidden="true"
              >
                <rect
                  x="1"
                  y="1"
                  width="24"
                  height="24"
                  rx="5"
                  fill="none"
                  stroke="#4CB4E6"
                  strokeWidth="2"
                />
                <path
                  d="M6 18 L11 8 L15 14 L20 7"
                  fill="none"
                  stroke="#E7ECF1"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="20" cy="7" r="2" fill="#4CB4E6" />
              </svg>
              <div
                className="od-stack"
                style={{ "--od-gap": "4px" } as CSSProperties}
              >
                <h1 className="brand-title" id="brandTitle">
                  AGV·AMR 통합 관제
                </h1>
                <p className="brand-desc">
                  1공장의 로봇 90대와 PLC 16점을 한 화면에서 관제합니다.
                </p>
              </div>
            </div>

            {form.notice && (
              <LoginNotice
                notice={form.notice}
                noticeRef={form.noticeRef}
                onRetry={() => void form.submit()}
              />
            )}

            <form
              className="login-form"
              noValidate
              aria-busy={busy}
              onSubmit={submit}
            >
              <div className="field">
                <label className="field-label" htmlFor="userId">
                  아이디
                </label>
                <input
                  className="input-lg"
                  id="userId"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="off"
                  spellCheck={false}
                  aria-describedby="userIdErr"
                  aria-invalid={Boolean(form.errors.username)}
                  ref={form.usernameRef}
                  value={form.username}
                  disabled={busy}
                  onChange={(event) => form.changeUsername(event.target.value)}
                  onKeyDown={enterToSubmit}
                />
                <FieldError id="userIdErr" message={form.errors.username} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="password">
                  비밀번호
                </label>
                <div className="pw-wrap">
                  <input
                    className="input-lg"
                    id="password"
                    name="password"
                    type={form.showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    aria-describedby="passwordErr"
                    aria-invalid={Boolean(form.errors.password)}
                    ref={form.passwordRef}
                    value={form.password}
                    disabled={busy}
                    onChange={(event) =>
                      form.changePassword(event.target.value)
                    }
                    onKeyDown={enterToSubmit}
                  />
                  <button
                    type="button"
                    className="pw-toggle"
                    aria-controls="password"
                    aria-pressed={form.showPassword}
                    aria-label={
                      form.showPassword ? "비밀번호 숨기기" : "비밀번호 보기"
                    }
                    disabled={busy}
                    onClick={form.toggleShowPassword}
                  >
                    {form.showPassword ? "숨기기" : "보기"}
                  </button>
                </div>
                <FieldError id="passwordErr" message={form.errors.password} />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-block"
                ref={form.submitRef}
                disabled={busy}
              >
                {form.phase === "idle" && "로그인"}
                {form.phase === "submitting" && (
                  <>
                    <span className="spin" aria-hidden="true" />
                    로그인 중…
                  </>
                )}
                {form.phase === "done" && (
                  <>
                    <Icon name="check" />
                    로그인됨 — 관제 화면으로 이동합니다
                  </>
                )}
              </button>
            </form>
          </section>

          <section className="demo-acct" aria-labelledby="acctTitle">
            <h2 className="demo-acct-title" id="acctTitle">
              심사용 데모 계정
            </h2>
            <p className="demo-acct-desc">
              과제 심사를 위해 마련한 계정입니다. 모든 기능을 같은 권한으로 쓸
              수 있습니다.
            </p>
            <dl>
              <dt>아이디</dt>
              <dd>{DEMO_ACCOUNT.username}</dd>
              <dt>비밀번호</dt>
              <dd>{DEMO_ACCOUNT.password}</dd>
            </dl>
            <button
              type="button"
              className="btn btn-sm"
              onClick={form.fillDemo}
            >
              입력란에 채우기
            </button>
          </section>

          <p className="login-foot">
            1공장 관제실 전용 시스템입니다. 접속이 안 되면 시스템 관리자에게
            문의하세요.
          </p>
        </div>
      </main>
    </div>
  );
};
