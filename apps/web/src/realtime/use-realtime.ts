import { useEffect, useSyncExternalStore } from "react";
import { realtimeClient } from "./realtime-client";
import { RealtimeView } from "./realtime.types";

const subscribe = (listener: () => void) => realtimeClient.subscribe(listener);
const getView = () => realtimeClient.getView();

/** 화면이 떠 있는 동안 WebSocket을 유지하고 최신 상태를 돌려준다. */
export const useRealtime = (): RealtimeView => {
  useEffect(() => {
    realtimeClient.start();
  }, []);
  return useSyncExternalStore(subscribe, getView);
};
