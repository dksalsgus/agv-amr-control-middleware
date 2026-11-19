import { useEffect, useState } from "react";

/** intervalMs마다 현재 시각(ms)으로 다시 그린다. "n초 전" 같은 표시에 쓴다. */
export const useNow = (intervalMs: number): number => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
};
