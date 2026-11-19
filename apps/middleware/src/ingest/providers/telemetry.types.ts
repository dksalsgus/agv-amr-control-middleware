import { RobotState } from "../../state/robot-state";

export type RobotTelemetry = {
  deviceId: string;
  state: RobotState;
};
