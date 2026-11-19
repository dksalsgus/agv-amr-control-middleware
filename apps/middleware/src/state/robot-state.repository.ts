import { Injectable } from "@nestjs/common";
import { RobotDevice, RobotEntry, RobotState } from "./robot-state";

/**
 * 로봇의 현재 상태를 담는 메모리 저장소. 현재 상태 테이블은 두지 않는다(설계 문서 5장).
 */
@Injectable()
export class RobotStateRepository {
  private readonly entries = new Map<string, RobotEntry>();
  private readonly deviceIdByExternalKey = new Map<string, string>();

  register(device: RobotDevice) {
    this.entries.set(device.deviceId, { ...device, state: null, rev: 0 });

    const externalKey = this.toExternalKey(
      device.connectionId,
      device.externalId,
    );
    this.deviceIdByExternalKey.set(externalKey, device.deviceId);
  }

  findById(deviceId: string): RobotEntry | undefined {
    return this.entries.get(deviceId);
  }

  findByExternalId(
    connectionId: string,
    externalId: string,
  ): RobotEntry | undefined {
    const externalKey = this.toExternalKey(connectionId, externalId);
    const deviceId = this.deviceIdByExternalKey.get(externalKey);
    if (!deviceId) {
      return undefined;
    }

    return this.entries.get(deviceId);
  }

  findAll(): RobotEntry[] {
    return [...this.entries.values()];
  }

  updateState(deviceId: string, state: RobotState, rev: number) {
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
