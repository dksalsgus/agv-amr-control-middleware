import { IconName } from "../components/icon";

export type LoginNotice = {
  tone: "danger" | "warn" | "ok";
  icon: IconName;
  title: string;
  body: string;
  /** 서버에 닿지 못했을 때만 "다시 시도"를 붙인다. */
  retry: boolean;
};

export type LoginFieldErrors = { username: string; password: string };

/** idle: 입력 중, submitting: 응답 대기, done: 성공 후 이동 대기 */
export type LoginPhase = "idle" | "submitting" | "done";
