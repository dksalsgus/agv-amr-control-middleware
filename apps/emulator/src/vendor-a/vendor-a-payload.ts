import { Robot } from "../simulation/robot";
import { RobotMode } from "../simulation/robot.types";
import { VendorAPayload } from "./vendor-a-payload.types";

export class VendorAPayloadBuilder {
  private static readonly MODE_MAP: Record<RobotMode, VendorAPayload["mode"]> =
    {
      IDLE: "idle",
      DRIVING: "driving",
      CHARGING: "charging",
    };

  topic(robot: Robot): string {
    return `vendorA/amr/${robot.serial}/state`;
  }

  build(robot: Robot, now: Date): VendorAPayload {
    return {
      seq: robot.seq,
      ts: now.toISOString(),
      pose: { x: robot.x, y: robot.y, theta: robot.theta },
      velocity: robot.speed,
      battery: { soc: robot.batteryPct / 100 },
      mode: VendorAPayloadBuilder.MODE_MAP[robot.mode],
      fault: null,
      payload: { loaded: robot.loaded },
    };
  }
}
