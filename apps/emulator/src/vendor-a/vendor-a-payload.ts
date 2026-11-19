import { Robot, RobotMode } from "../simulation/robot";

/** 제조사 A의 MQTT JSON 형식 (설계 문서 4장 로봇 매핑표 A열) */
export type VendorAPayload = {
  seq: number;
  ts: string;
  pose: { x: number; y: number; theta: number };
  velocity: number;
  battery: { soc: number };
  mode: "idle" | "driving" | "charging" | "paused" | "fault";
  fault: { code: string } | null;
  payload: { loaded: boolean };
};

const MODE_MAP: Record<RobotMode, VendorAPayload["mode"]> = {
  IDLE: "idle",
  DRIVING: "driving",
  CHARGING: "charging",
};

export class VendorAPayloadBuilder {
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
      mode: MODE_MAP[robot.mode],
      fault: null,
      payload: { loaded: robot.loaded },
    };
  }
}
