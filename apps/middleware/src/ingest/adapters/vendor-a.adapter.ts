import { Injectable } from "@nestjs/common";
import { radianToDegree } from "../../common/utils/angle.util";
import { RobotOpState } from "../../state/robot-state";
import { MqttRawMessage } from "../repositories/mqtt-client.types";
import { RobotReading, VendorAdapter } from "./vendor-adapter";
import { VendorAMode, VendorAPayload } from "./vendor-a.types";

/** 제조사 A: MQTT JSON (m, rad, 배터리 0~1) */
@Injectable()
export class VendorAAdapter implements VendorAdapter<MqttRawMessage> {
  private static readonly OP_STATE_BY_MODE: Record<VendorAMode, RobotOpState> =
    {
      idle: "IDLE",
      driving: "MOVING",
      charging: "CHARGING",
      paused: "PAUSED",
      fault: "ERROR",
    };

  readonly vendorCode = "VENDOR_A";

  async toCommon(raw: MqttRawMessage): Promise<RobotReading[]> {
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
        opState: VendorAAdapter.OP_STATE_BY_MODE[payload.mode],
        errorCode: payload.fault?.code ?? null,
        loaded: payload.payload.loaded,
      },
    ];
  }

  /** 토픽 vendorA/amr/{serial}/state 에서 serial을 꺼낸다. */
  private parseSerial(topic: string): string {
    const serial = topic.split("/")[2];
    if (!serial) {
      throw new Error(`제조사 A 토픽 형식이 아니다: ${topic}`);
    }

    return serial;
  }
}
