import { Injectable } from "@nestjs/common";
import { radianToDegree } from "../../common/utils/angle.util";
import { RobotOpState } from "../../state/robot-state";
import { MqttRawMessage } from "../repositories/mqtt-client.repository";
import { RobotReading, VendorAdapter } from "./vendor-adapter";

type VendorAMode = "idle" | "driving" | "charging" | "paused" | "fault";

type VendorAPayload = {
  seq: number;
  ts: string;
  pose: { x: number; y: number; theta: number };
  velocity: number;
  battery: { soc: number };
  mode: VendorAMode;
  fault: { code: string } | null;
  payload: { loaded: boolean };
};

const OP_STATE_BY_MODE: Record<VendorAMode, RobotOpState> = {
  idle: "IDLE",
  driving: "MOVING",
  charging: "CHARGING",
  paused: "PAUSED",
  fault: "ERROR",
};

/**
 * 제조사 A: MQTT JSON. 토픽 vendorA/amr/{serial}/state, 좌표 m, 방향 rad, 배터리 0~1.
 */
@Injectable()
export class VendorAAdapter implements VendorAdapter<MqttRawMessage> {
  readonly vendorCode = "VENDOR_A";

  toCommon(raw: MqttRawMessage): RobotReading[] {
    const serial = this.parseSerial(raw.topic);
    const payload = JSON.parse(raw.payload.toString()) as VendorAPayload;

    return [
      {
        externalId: serial,
        seq: payload.seq,
        sourceTs: new Date(payload.ts),
        x: payload.pose.x,
        y: payload.pose.y,
        theta: radianToDegree(payload.pose.theta),
        speed: payload.velocity,
        batteryPct: Math.round(payload.battery.soc * 100),
        opState: OP_STATE_BY_MODE[payload.mode],
        errorCode: payload.fault?.code ?? null,
        loaded: payload.payload.loaded,
      },
    ];
  }

  private parseSerial(topic: string): string {
    const serial = topic.split("/")[2];
    if (!serial) {
      throw new Error(`제조사 A 토픽 형식이 아니다: ${topic}`);
    }

    return serial;
  }
}
