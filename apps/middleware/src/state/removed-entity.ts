/** WebSocket으로 내보내는 엔티티 종류 */
export const ENTITY_KINDS = ["ROBOT", "PLC_POINT", "LINK"] as const;
export type EntityKind = (typeof ENTITY_KINDS)[number];

/** 지워진 엔티티. 지운 시점의 rev로 delta.removed에 실린다. */
export type RemovedEntity = {
  kind: EntityKind;
  id: string;
  rev: number;
};
