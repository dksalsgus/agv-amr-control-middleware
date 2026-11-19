import { LoginNotice } from "./login.types";

/** 성공 문구를 잠깐 보여 준 뒤 이동한다. */
export const REDIRECT_MS = 700;

/** 시드가 넣는 데모 계정. 역할 구분이 없어 어느 계정이든 같은 기능을 쓴다. */
export const DEMO_ACCOUNT = { username: "operator", password: "operator1234" };

export const NOTICE = {
  expired: {
    tone: "warn",
    icon: "clock",
    title: "세션이 만료되었습니다",
    body: "오랫동안 사용하지 않아 자동으로 로그아웃되었습니다. 다시 로그인하면 보던 화면으로 돌아갑니다.",
    retry: false,
  },
  unauthorized: {
    tone: "danger",
    icon: "critical",
    title: "아이디 또는 비밀번호가 맞지 않습니다",
    body: "대소문자와 Caps Lock을 확인한 뒤 다시 입력해 주세요.",
    retry: false,
  },
  unreachable: {
    tone: "danger",
    icon: "unplug",
    title: "서버에 연결할 수 없습니다",
    body: "네트워크 연결을 확인하거나 잠시 후 다시 시도해 주세요. 입력한 내용은 그대로 남아 있습니다.",
    retry: true,
  },
  success: {
    tone: "ok",
    icon: "check",
    title: "로그인되었습니다",
    body: "잠시 후 관제 화면으로 이동합니다.",
    retry: false,
  },
} satisfies Record<string, LoginNotice>;
