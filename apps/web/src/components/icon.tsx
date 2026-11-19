import { CSSProperties } from "react";

/** 디자인의 선 아이콘 한 벌 */
const ICON_PATHS = {
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" />
      <path d="M12 7.5v.5" />
    </>
  ),
  warn: (
    <>
      <path d="M12 3.5 2.8 19.5h18.4z" />
      <path d="M12 10v4.5" />
      <path d="M12 17.2v.3" />
    </>
  ),
  critical: (
    <>
      <path d="M8.2 3h7.6L21 8.2v7.6L15.8 21H8.2L3 15.8V8.2z" />
      <path d="M12 8v5" />
      <path d="M12 16v.3" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M7 7l10 10M17 7 7 17" />,
  question: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7" />
      <path d="M12 16.8v.3" />
    </>
  ),
  unplug: (
    <>
      <path d="M4 20l4-4" />
      <path d="M20 4l-4 4" />
      <path d="M7 13l4 4" />
      <path d="M13 7l4 4" />
      <path d="M3 3l18 18" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  arrow: (
    <>
      <path d="M4 12h15" />
      <path d="M14 7l5 5-5 5" />
    </>
  ),
  logout: (
    <>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 17l-5-5 5-5" />
      <path d="M5 12h11" />
    </>
  ),
};

export type IconName = keyof typeof ICON_PATHS;

type Props = { name: IconName; size?: number };

export const Icon = ({ name, size }: Props) => {
  const style = size
    ? ({ "--od-icon-size": `${size}px` } as CSSProperties)
    : undefined;
  return (
    <svg
      className="od-icon"
      style={style}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
};
