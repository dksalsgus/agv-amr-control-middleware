import { CSSProperties } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { authApi } from "../auth/auth.api";
import { tokenStorage } from "../auth/token-storage";
import { useNow } from "../common/hooks/use-now";
import { formatTime } from "../common/utils/format.util";
import { realtimeClient } from "../realtime/realtime-client";
import { Icon } from "./icon";

export type LivePill = {
  tone: "ok" | "info" | "warn" | "danger";
  text: string;
  pulse: boolean;
};

type Props = { live?: LivePill };

const TABS = [
  { to: "/", label: "관제" },
  { to: "/logs", label: "이력" },
  { to: "/connections", label: "연결 설정" },
  { to: "/faults", label: "장애 주입" },
];

/** 모든 화면이 같은 자리에 쓰는 상단 내비게이션 */
export const Gnb = ({ live }: Props) => {
  const navigate = useNavigate();
  const now = useNow(1000);
  const username = tokenStorage.find()?.username ?? "";

  const logout = async () => {
    realtimeClient.stop();
    authApi.logout();
    await navigate("/login", { replace: true });
  };

  return (
    <header className="gnb">
      <div className="gnb-brand">
        <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
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
        <div className="od-stack" style={{ "--od-gap": 0 } as CSSProperties}>
          <span className="gnb-title">AGV·AMR 통합 관제</span>
          <span className="gnb-site">1공장 · 로봇 90대 · PLC 16점</span>
        </div>
      </div>
      <nav className="gnb-tabs" aria-label="주 메뉴">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end className="gnb-tab">
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <div className="gnb-end">
        {live && (
          <span
            className="live-pill"
            role="status"
            data-tone={live.tone}
            data-pulse={String(live.pulse)}
          >
            <span className="dot" />
            <span>{live.text}</span>
          </span>
        )}
        <span className="gnb-clock mono">{formatTime(now)}</span>
        <span className="gnb-divider" aria-hidden="true" />
        <div className="gnb-user">
          <span className="avatar" aria-hidden="true">
            {username.slice(0, 1).toUpperCase()}
          </span>
          <span className="gnb-user-name">{username}</span>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => void logout()}
        >
          <Icon name="logout" />
          로그아웃
        </button>
      </div>
    </header>
  );
};
