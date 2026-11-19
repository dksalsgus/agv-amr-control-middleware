import { useEffect, useState } from "react";
import { connectionStatsApi } from "./connection-stats.api";
import { CONNECTION_STATS_POLL_MS } from "./monitor.constants";
import { ConnectionStats } from "./monitor.types";

export type ConnectionStatsView = {
  windowSec: number;
  byId: ReadonlyMap<string, ConnectionStats>;
};

const EMPTY: ConnectionStatsView = { windowSec: 30, byId: new Map() };

/** 연결별 최근 건수를 주기적으로 받아 온다. 실패하면 마지막 값을 그대로 둔다. */
export const useConnectionStats = (): ConnectionStatsView => {
  const [view, setView] = useState<ConnectionStatsView>(EMPTY);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await connectionStatsApi.findAll();
        setView({
          windowSec: response.windowSec,
          byId: new Map(
            response.connections.map((item) => [item.connectionId, item]),
          ),
        });
      } catch {
        // 관제의 다른 정보는 WebSocket으로 오므로 이 숫자만 잠시 멈춘다.
      }
    };
    void load();
    const timer = window.setInterval(
      () => void load(),
      CONNECTION_STATS_POLL_MS,
    );
    return () => window.clearInterval(timer);
  }, []);

  return view;
};
