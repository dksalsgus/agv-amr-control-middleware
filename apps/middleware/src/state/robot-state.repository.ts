import { Injectable } from "@nestjs/common";
import { RobotDevice, RobotEntry, RobotState } from "./robot-state";

/** 로봇 현재 상태(메모리). 현재 상태 테이블은 두지 않는다. */
@Injectable()
export class RobotStateRepository {
  private readonly entries = new Map<string, RobotEntry>();
  private readonly deviceIdByExternalKey = new Map<string, string>();

  async register(device: RobotDevice): Promise<void> {
    this.entries.set(device.deviceId, { ...device, state: null, rev: 0 });

    const externalKey = this.toExternalKey(
      device.connectionId,
      device.externalId,
    );
    this.deviceIdByExternalKey.set(externalKey, device.deviceId);
  }

  async remove(deviceId: string): Promise<void> {
    const entry = this.entries.get(deviceId);
    if (!entry) {
      return;
    }

    this.entries.delete(deviceId);
    this.deviceIdByExternalKey.delete(
      this.toExternalKey(entry.connectionId, entry.externalId),
    );
  }

  async findById(deviceId: string): Promise<RobotEntry | undefined> {
    return this.entries.get(deviceId);
  }

  async findByExternalId(
    connectionId: string,
    externalId: string,
  ): Promise<RobotEntry | undefined> {
    const externalKey = this.toExternalKey(connectionId, externalId);
    const deviceId = this.deviceIdByExternalKey.get(externalKey);
    if (!deviceId) {
      return undefined;
    }

    return this.entries.get(deviceId);
  }

  async findAll(): Promise<RobotEntry[]> {
    return [...this.entries.values()];
  }

  async updateState(
    deviceId: string,
    state: RobotState,
    rev: number,
  ): Promise<void> {
    const entry = this.entries.get(deviceId);
    if (!entry) {
      return;
    }

    entry.state = state;
    entry.rev = rev;
  }

  private toExternalKey(connectionId: string, externalId: string): string {
    return `${connectionId}:${externalId}`;
  }
}
