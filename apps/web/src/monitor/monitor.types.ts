export type VendorKey = "A" | "B" | "C";

/** 화면 전체 상태. 서버 연결 상태와 현장 연결 상태를 합친 것 */
export type MonitorMode =
  | "connecting"
  | "live"
  | "linkDown"
  | "disconnected"
  | "reconnecting";

/** 맵과 상세가 쓰는 로봇 한 대 */
export type MapRobot = {
  id: string;
  name: string;
  vendor: VendorKey;
  connectionId: string;
  type: string;
  x: number;
  y: number;
  theta: number;
  speed: number;
  batteryPct: number;
  opState: string;
  errorCode: string | null;
  loaded: boolean;
  seq: number;
  sourceTs: string;
  receivedTs: string;
  stale: boolean;
};

export type MapFilters = {
  vendors: ReadonlySet<VendorKey>;
  states: ReadonlySet<string>;
};

/** GET /metrics/connections의 연결 한 줄. 최근 windowSec초 동안의 건수 */
export type ConnectionStats = {
  connectionId: string;
  received: number;
  duplicates: number;
  outOfOrder: number;
  /** 표본이 적으면 null */
  lossPct: number | null;
};
