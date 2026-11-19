import { Robot, RobotMode } from "../simulation/robot";

/** 제조사 B의 REST JSON 형식 (설계 문서 4장 로봇 매핑표 B열) */
export type VendorBVehicle = {
  vehicleId: string;
  sequence: number;
  timestamp: number;
  position: { xMm: number; yMm: number };
  headingDeg: number;
  speedMmS: number;
  batteryLevel: number;
  status: "IDLE" | "RUN" | "CHG" | "STOP" | "ERR";
  errorCode: string;
  hasLoad: boolean;
};

const STATUS_MAP: Record<RobotMode, VendorBVehicle["status"]> = {
  IDLE: "IDLE",
  DRIVING: "RUN",
  CHARGING: "CHG",
};

const radianToDegree = (radian: number) => {
  const degree = (radian * 180) / Math.PI;
  return ((degree % 360) + 360) % 360;
};

export class VendorBPayloadBuilder {
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
      status: STATUS_MAP[robot.mode],
      errorCode: "",
      hasLoad: robot.loaded,
    };
  }
}
