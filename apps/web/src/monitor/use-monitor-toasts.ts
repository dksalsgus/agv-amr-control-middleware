import { useEffect, useRef } from "react";
import { ToastTone } from "../components/use-toasts";
import { MonitorMode } from "./monitor.types";

const OFFLINE: MonitorMode[] = ["disconnected", "reconnecting"];

/** 서버 연결이 끊기거나 돌아올 때 한 번씩 알린다. 재시도 중 오가는 상태로는 다시 알리지 않는다. */
export const useMonitorToasts = (
  mode: MonitorMode,
  push: (text: string, tone: ToastTone) => void,
) => {
  const previous = useRef<MonitorMode>(mode);

  useEffect(() => {
    const before = previous.current;
    previous.current = mode;
    if (before === mode) {
      return;
    }
    const wasOffline = OFFLINE.includes(before);
    if (mode === "disconnected" && !wasOffline) {
      push("서버 연결이 끊겼습니다. 마지막 상태를 표시합니다.", "danger");
    }
    if (wasOffline && !OFFLINE.includes(mode)) {
      push("서버 연결 복구 — 실시간 수신을 재개했습니다.", "ok");
    }
  }, [mode, push]);
};
