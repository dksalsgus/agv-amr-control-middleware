import { Ref } from "react";
import { Icon } from "../components/icon";
import { LoginNotice as Notice } from "./login.types";

type Props = {
  notice: Notice;
  noticeRef: Ref<HTMLDivElement>;
  onRetry: () => void;
};

export const LoginNotice = ({ notice, noticeRef, onRetry }: Props) => (
  <div
    className="notice"
    data-tone={notice.tone}
    role={notice.tone === "danger" ? "alert" : "status"}
    tabIndex={-1}
    ref={noticeRef}
  >
    <Icon name={notice.icon} size={16} />
    <div className="notice-body">
      <strong>{notice.title}</strong>
      <span>{notice.body}</span>
      {notice.retry && (
        <button type="button" className="link-btn" onClick={onRetry}>
          다시 시도
        </button>
      )}
    </div>
  </div>
);
