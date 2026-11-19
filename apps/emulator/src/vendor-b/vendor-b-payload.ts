import { radianToDegree } from "../common/utils/angle.util";
import { Robot } from "../simulation/robot";
import { RobotMode } from "../simulation/robot.types";
import { VendorBVehicle } from "./vendor-b-payload.types";

export class VendorBPayloadBuilder {
  private static readonly STATUS_MAP: Record<
    RobotMode,
    VendorBVehicle["status"]
  > = {
    IDLE: "IDLE",
    DRIVING: "RUN",
    CHARGING: "CHG",
  };

  build(robot: Robot, sampledAt: Date): VendorBVehicle {
    return {
      vehicleId: robot.serial,
      sequence: robot.seq,
      timestamp: sampledAt.getTime(),
      position: {
        xMm: Math.round(robot.x * 1000),
        yMm: Math.round(robot.y * 1000),
      },
      headingDeg: Math.round(radianToDegree(robot.theta) * 10) / 10,
      speedMmS: Math.round(robot.speed * 1000),
      batteryLevel: Math.round(robot.batteryPct),
      status: VendorBPayloadBuilder.STATUS_MAP[robot.mode],
      errorCode: "",
      hasLoad: robot.loaded,
    };
  }
}
