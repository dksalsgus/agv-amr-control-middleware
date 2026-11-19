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

  /** MQTT로 보낼 때의 토픽. 본문은 REST 한 대 응답과 같다. */
  topic(robot: Robot): string {
    return `vendorB/agv/${robot.serial}/state`;
  }

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
      status:
        robot.errorCode === null
          ? VendorBPayloadBuilder.STATUS_MAP[robot.mode]
          : "ERR",
      errorCode: robot.errorCode === null ? "" : `E${robot.errorCode}`,
      hasLoad: robot.loaded,
    };
  }
}
