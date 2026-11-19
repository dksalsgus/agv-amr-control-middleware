import { useCallback, useState } from "react";

export type ToastTone = "ok" | "info" | "warn" | "danger";
export type Toast = { id: number; text: string; tone: ToastTone };

const TOAST_MS = 4200;
const MAX_TOASTS = 3;

/** 화면 오른쪽 아래에 잠깐 뜨는 알림. 최대 3개만 남긴다. */
export const useToasts = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((text: string, tone: ToastTone) => {
    const id = Date.now() + Math.random();
    setToasts((current) =>
      current.concat({ id, text, tone }).slice(-MAX_TOASTS),
    );
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_MS);
  }, []);

  return { toasts, push };
};
