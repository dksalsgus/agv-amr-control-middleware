import { Injectable, Inject } from "@nestjs/common";
import { LinkStatus } from "../state/link-state";
import { PlcDeviceLastRead } from "../state/plc-point-state";
import { RobotState } from "../state/robot-state";
import { staleConfig } from "../config/stale.config";
import { ConfigType } from "@nestjs/config";

@Injectable()
export class StaleJudgeProvider {
  constructor(
    @Inject(staleConfig.KEY)
    private readonly config: ConfigType<typeof staleConfig>,
  ) {}

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
    return (
      silentMs > this.config.robotSilenceMs || delayMs > this.config.maxDelayMs
    );
  }

  async isPlcStale(
    lastRead: PlcDeviceLastRead | null,
    linkStatus: LinkStatus,
    now: Date,
  ): Promise<boolean> {
    if (linkStatus === "DOWN" || !lastRead) {
      return true;
    }

    return (
      now.getTime() - lastRead.receivedTs.getTime() > this.config.plcSilenceMs
    );
  }
}
