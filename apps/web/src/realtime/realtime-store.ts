import {
  Alarm,
  DeltaMessage,
  DeltaResult,
  Link,
  PlcPoint,
  RealtimeView,
  Robot,
  SnapshotMessage,
  SocketStatus,
} from "./realtime.types";

/** snapshot과 delta를 받아 현재 상태를 만든다. 반영할 때마다 새 view를 만든다. */
export class RealtimeStore {
  private view: RealtimeView = {
    status: "CONNECTING",
    epoch: null,
    rev: 0,
    robots: new Map(),
    plcPoints: new Map(),
    links: new Map(),
    alarms: new Map(),
    lastRecoveryMs: null,
  };

  getView(): RealtimeView {
    return this.view;
  }

  /** 이어받기를 요청할 때 보낼 값. 처음이면 비운다. */
  getResumePoint(): { epoch: string | null; rev: number } {
    return { epoch: this.view.epoch, rev: this.view.rev };
  }

  applySnapshot(snapshot: SnapshotMessage): void {
    this.view = this.toView({
      epoch: snapshot.epoch,
      rev: snapshot.rev,
      robots: this.toMap(snapshot.robots, (robot) => robot.id),
      plcPoints: this.toMap(snapshot.plcPoints, (point) => point.id),
      links: this.toMap(snapshot.links, (link) => link.connectionId),
      alarms: this.toMap(snapshot.alarms, (alarm) => alarm.id),
    });
  }

  /** fromRev가 내 rev와 같을 때만 반영한다. 작으면 이미 본 것, 크면 중간을 놓친 것이다. */
  applyDelta(delta: DeltaMessage): DeltaResult {
    if (delta.fromRev < this.view.rev) {
      return "ALREADY_SEEN";
    }
    if (delta.fromRev > this.view.rev) {
      return "GAP";
    }

    const robots = this.merge(this.view.robots, delta.robots, (r) => r.id);
    const plcPoints = this.merge(
      this.view.plcPoints,
      delta.plcPoints,
      (p) => p.id,
    );
    const links = this.merge(
      this.view.links,
      delta.links,
      (l) => l.connectionId,
    );
    const alarms = this.merge(this.view.alarms, delta.alarms, (a) => a.id);

    for (const removed of delta.removed) {
      if (removed.kind === "ROBOT") {
        robots.delete(removed.id);
      } else if (removed.kind === "PLC_POINT") {
        plcPoints.delete(removed.id);
      } else if (removed.kind === "LINK") {
        links.delete(removed.id);
      } else {
        alarms.delete(removed.id);
      }
    }

    this.view = this.toView({
      epoch: this.view.epoch,
      rev: delta.rev,
      robots,
      plcPoints,
      links,
      alarms,
    });
    return "APPLIED";
  }

  setStatus(status: SocketStatus): void {
    if (this.view.status === status) {
      return;
    }
    this.view = this.copyView({ status });
  }

  setRecovery(lastRecoveryMs: number): void {
    this.view = this.copyView({ lastRecoveryMs });
  }

  private toView(entities: {
    epoch: string | null;
    rev: number;
    robots: Map<string, Robot>;
    plcPoints: Map<string, PlcPoint>;
    links: Map<string, Link>;
    alarms: Map<string, Alarm>;
  }): RealtimeView {
    return {
      status: this.view.status,
      epoch: entities.epoch,
      rev: entities.rev,
      robots: entities.robots,
      plcPoints: entities.plcPoints,
      links: entities.links,
      alarms: entities.alarms,
      lastRecoveryMs: this.view.lastRecoveryMs,
    };
  }

  private copyView(changes: {
    status?: SocketStatus;
    lastRecoveryMs?: number;
  }): RealtimeView {
    return {
      status: changes.status ?? this.view.status,
      epoch: this.view.epoch,
      rev: this.view.rev,
      robots: this.view.robots,
      plcPoints: this.view.plcPoints,
      links: this.view.links,
      alarms: this.view.alarms,
      lastRecoveryMs: changes.lastRecoveryMs ?? this.view.lastRecoveryMs,
    };
  }

  private toMap<T>(items: T[], toKey: (item: T) => string): Map<string, T> {
    return new Map(items.map((item) => [toKey(item), item]));
  }

  private merge<T>(
    current: ReadonlyMap<string, T>,
    changed: T[],
    toKey: (item: T) => string,
  ): Map<string, T> {
    const merged = new Map(current);
    for (const item of changed) {
      merged.set(toKey(item), item);
    }
    return merged;
  }
}
