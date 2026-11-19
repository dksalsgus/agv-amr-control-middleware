import { ConnectionItem } from "./connections.types";

/** 목록과 머리에 보이는 진행 중 표시 */
export type ConnectionPhase = "saving" | "reconnecting" | "stopping";

/** 저장 진행·결과 안내. 디자인의 저장 흐름 상태와 같다. */
export type SaveFlow =
  | { phase: "saving" }
  | { phase: "reconnecting"; version: number; startedAt: number }
  | { phase: "done"; version: number; reconnectedAt: number; at: number }
  | {
      phase: "failed";
      version: number;
      reconnectedAt: number;
      at: number;
      created: boolean;
    }
  | { phase: "created"; reconnectedAt: number; at: number }
  | { phase: "createdWaiting"; startedAt: number }
  | { phase: "invalid"; messages: InvalidMessage[] }
  | { phase: "conflict"; from: number; to: number; rows: ConflictRow[] }
  | { phase: "rebased"; to: number }
  | { phase: "savedDisabled"; version: number };

export type ConflictRow = {
  label: string;
  mine: string;
  latest: string;
  theirs: boolean;
  mineChanged: boolean;
};

/** 목록 한 줄: REST 목록 값에 실시간 링크 상태를 덮은 것 */
export type ConnectionRow = ConnectionItem & {
  status: string;
  changedAt: string | null;
};

/** 400 안내의 한 줄. key가 있으면 그 입력란으로 이동할 수 있다. */
export type InvalidMessage = {
  key: string | null;
  label: string;
  text: string;
};
