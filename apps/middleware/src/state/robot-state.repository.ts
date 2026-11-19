import { Injectable } from "@nestjs/common";
import { RobotDevice, RobotEntry, RobotState } from "./robot-state";

/**
 * 로봇의 현재 상태를 담는 메모리 저장소. 현재 상태 테이블은 두지 않는다(설계 문서 5장).
 * 메모리라 실제로는 동기지만 모든 레이어 메서드를 async로 두는 규칙을 따른다.
 */
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
