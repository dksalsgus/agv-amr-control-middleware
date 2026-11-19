import { ConfigType } from "@nestjs/config";
import { staleConfig } from "../../config/stale.config";
import { LinkStatus } from "../../state/link-state";
import { PlcDeviceLastRead } from "../../state/plc-point-state";
import { RobotState } from "../../state/robot-state";

export const isRobotStale = (
  state: RobotState | null,
  linkStatus: LinkStatus,
  now: Date,
  config: ConfigType<typeof staleConfig>,
): boolean => {
  if (linkStatus === "DOWN" || !state) {
    return true;
  }

  const silentMs = now.getTime() - state.receivedTs.getTime();
  const delayMs = state.receivedTs.getTime() - state.sourceTs.getTime();
  return silentMs > config.robotSilenceMs || delayMs > config.maxDelayMs;
};

export const isPlcStale = (
  lastRead: PlcDeviceLastRead | null,
  linkStatus: LinkStatus,
  now: Date,
  config: ConfigType<typeof staleConfig>,
): boolean => {
  if (linkStatus === "DOWN" || !lastRead) {
    return true;
  }

  return now.getTime() - lastRead.receivedTs.getTime() > config.plcSilenceMs;
};
