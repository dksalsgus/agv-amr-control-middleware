import { Injectable } from "@nestjs/common";
import { LinkStatus } from "../state/link-state";
import { PlcDeviceLastRead } from "../state/plc-point-state";
import { RobotState } from "../state/robot-state";

/** 주기의 3배 동안 새 읽기가 없으면 STALE (로봇 1초, PLC 500ms 주기) */
const ROBOT_STALE_MS = 3000;
const PLC_STALE_MS = 1500;
/** 발생 시각보다 이만큼 늦게 받으면 지연으로 보고 STALE */
const MAX_DELAY_MS = 3000;

/** 장비 데이터가 믿을 만한지(STALE이 아닌지) 판정한다. */
@Injectable()
export class StaleJudgeProvider {
  async isRobotStale(
    state: RobotState | null,
    linkStatus: LinkStatus,
    now: Date,
  ): Promise<boolean> {
    if (linkStatus === "DOWN" || !state) {
      return true;
    }

    const silentMs = now.getTime() - state.receivedTs.getTime();
    const delayMs = state.receivedTs.getTime() - state.sourceTs.getTime();
    return silentMs > ROBOT_STALE_MS || delayMs > MAX_DELAY_MS;
  }

  async isPlcStale(
    lastRead: PlcDeviceLastRead | null,
    linkStatus: LinkStatus,
    now: Date,
  ): Promise<boolean> {
    if (linkStatus === "DOWN" || !lastRead) {
      return true;
    }

    return now.getTime() - lastRead.receivedTs.getTime() > PLC_STALE_MS;
  }
}
