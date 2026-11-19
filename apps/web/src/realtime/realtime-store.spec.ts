import { describe, expect, it } from "vitest";
import { RealtimeStore } from "./realtime-store";
import { DeltaMessage, Link, SnapshotMessage } from "./realtime.types";

const link = (connectionId: string, status: string, rev: number): Link => ({
  connectionId,
  status,
  changedAt: null,
  rev,
});

const snapshot = (rev: number, links: Link[]): SnapshotMessage => ({
  epoch: "e1",
  rev,
  robots: [],
  plcPoints: [],
  links,
  alarms: [],
});

const delta = (
  fromRev: number,
  rev: number,
  links: Link[],
  removed: DeltaMessage["removed"],
): DeltaMessage => ({
  fromRev,
  rev,
  robots: [],
  plcPoints: [],
  links,
  alarms: [],
  removed,
});

describe("RealtimeStore", () => {
  it("snapshot이 상태를 통째로 바꾼다", () => {
    const store = new RealtimeStore();
    store.applySnapshot(snapshot(10, [link("a", "UP", 10)]));

    expect(store.getView().rev).toBe(10);
    expect(store.getView().links.get("a")?.status).toBe("UP");
    expect(store.getResumePoint()).toEqual({ epoch: "e1", rev: 10 });
  });

  it("fromRev가 내 rev와 같으면 반영하고 새 view를 만든다", () => {
    const store = new RealtimeStore();
    store.applySnapshot(snapshot(10, [link("a", "UP", 10)]));
    const before = store.getView();

    const result = store.applyDelta(delta(10, 12, [link("a", "DOWN", 12)], []));

    expect(result).toBe("APPLIED");
    expect(store.getView()).not.toBe(before);
    expect(store.getView().rev).toBe(12);
    expect(store.getView().links.get("a")?.status).toBe("DOWN");
    expect(before.links.get("a")?.status).toBe("UP");
  });

  it("이미 본 delta는 버린다", () => {
    const store = new RealtimeStore();
    store.applySnapshot(snapshot(10, [link("a", "UP", 10)]));

    const result = store.applyDelta(delta(8, 10, [link("a", "DOWN", 9)], []));

    expect(result).toBe("ALREADY_SEEN");
    expect(store.getView().links.get("a")?.status).toBe("UP");
  });

  it("중간을 놓치면 GAP을 알리고 반영하지 않는다", () => {
    const store = new RealtimeStore();
    store.applySnapshot(snapshot(10, []));

    const result = store.applyDelta(delta(11, 13, [link("a", "UP", 13)], []));

    expect(result).toBe("GAP");
    expect(store.getView().rev).toBe(10);
    expect(store.getView().links.size).toBe(0);
  });

  it("removed에 실린 엔티티를 지운다", () => {
    const store = new RealtimeStore();
    store.applySnapshot(snapshot(10, [link("a", "UP", 10)]));

    store.applyDelta(delta(10, 11, [], [{ kind: "LINK", id: "a" }]));

    expect(store.getView().links.has("a")).toBe(false);
  });

  it("연결 상태가 같으면 view를 바꾸지 않는다", () => {
    const store = new RealtimeStore();
    store.setStatus("OPEN");
    const before = store.getView();

    store.setStatus("OPEN");

    expect(store.getView()).toBe(before);
  });
});
