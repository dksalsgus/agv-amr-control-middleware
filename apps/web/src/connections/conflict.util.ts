import { activeKeys, getValue, labelOf } from "./connection-draft.util";
import { ConflictRow } from "./connections-view.types";
import { ConnectionDraft } from "./connections.types";

const shown = (draft: ConnectionDraft, key: string): string => {
  if (key === "cfg.password") {
    return draft.config.password ? "(새 비밀번호)" : "(유지)";
  }
  return getValue(draft, key) || "(비어 있음)";
};

/** 409 비교표: 내가 편집한 값, 최신 값, 그리고 누가 바꿨는지 */
export const conflictRows = (
  mine: ConnectionDraft,
  before: ConnectionDraft,
  latest: ConnectionDraft,
): ConflictRow[] =>
  activeKeys(mine, false)
    .map((key) => {
      const mineValue = shown(mine, key);
      const latestValue = shown(latest, key);
      const beforeValue = shown(before, key);
      return {
        label: labelOf(mine.protocol, key),
        mine: mineValue,
        latest: latestValue,
        theirs: beforeValue !== latestValue,
        mineChanged: mineValue !== beforeValue,
      };
    })
    .filter((row) => row.mine !== row.latest || row.theirs);
