import { Injectable } from "@nestjs/common";
import { normalizeDegree } from "../../common/utils/angle.util";
import { RobotOpState } from "../../state/robot-state";
import { MqttRawMessage } from "../repositories/mqtt-client.types";
import { RestRawMessage } from "../repositories/rest-client.types";
import { RobotReading, VendorAdapter } from "./vendor-adapter";
import { VendorBStatus, VendorBVehicle } from "./vendor-b.types";

/**
 * 제조사 B: JSON (mm, 도, mm/s). REST는 전체 목록과 한 대 응답을,
 * MQTT는 토픽 vendorB/agv/{serial}/state로 한 대 응답과 같은 본문을 받는다.
 */
@Injectable()
export class VendorBAdapter
  implements VendorAdapter<RestRawMessage | MqttRawMessage>
{
  private static readonly OP_STATE_BY_STATUS: Record<
    VendorBStatus,
    RobotOpState
  > = {
    IDLE: "IDLE",
    RUN: "MOVING",
    CHG: "CHARGING",
    STOP: "PAUSED",
    ERR: "ERROR",
  };

  readonly vendorCode = "VENDOR_B";

  async toCommon(
    raw: RestRawMessage | MqttRawMessage,
  ): Promise<RobotReading[]> {
    const body =
      "payload" in raw
        ? (JSON.parse(raw.payload.toString()) as unknown)
        : raw.body;
    const vehicles = this.toVehicles(body);

    const readings: RobotReading[] = vehicles.map((vehicle) =>
      this.toReading(vehicle),
    );

    return readings;
  }

  private toVehicles(body: unknown): VendorBVehicle[] {
    const list = (body as { vehicles?: VendorBVehicle[] }).vehicles;
    if (Array.isArray(list)) {
      return list;
    }

    return [body as VendorBVehicle];
  }

  private toReading(vehicle: VendorBVehicle): RobotReading {
    return {
      externalId: vehicle.vehicleId,
      seq: vehicle.sequence,
      sourceTs: new Date(vehicle.timestamp),
      x: vehicle.position.xMm / 1000,
      y: vehicle.position.yMm / 1000,
      theta: normalizeDegree(vehicle.headingDeg),
      speed: vehicle.speedMmS / 1000,
      batteryPct: vehicle.batteryLevel,
      opState: VendorBAdapter.OP_STATE_BY_STATUS[vehicle.status],
      errorCode: vehicle.errorCode === "" ? null : vehicle.errorCode,
      loaded: vehicle.hasLoad,
    };
  }
}
