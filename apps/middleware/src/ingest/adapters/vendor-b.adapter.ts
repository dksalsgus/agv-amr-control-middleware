import { Injectable } from "@nestjs/common";
import { normalizeDegree } from "../../common/utils/angle.util";
import { RobotOpState } from "../../state/robot-state";
import { RestRawMessage } from "../repositories/rest-client.types";
import { RobotReading, VendorAdapter } from "./vendor-adapter";
import { VendorBStatus, VendorBVehicle } from "./vendor-b.types";

/** 제조사 B: REST JSON (mm, 도, mm/s). 전체 목록과 한 대 응답을 모두 받는다. */
@Injectable()
export class VendorBAdapter implements VendorAdapter<RestRawMessage> {
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

  async toCommon(raw: RestRawMessage): Promise<RobotReading[]> {
    const vehicles = await this.toVehicles(raw.body);

    const readings: RobotReading[] = [];
    for (const vehicle of vehicles) {
      readings.push(await this.toReading(vehicle));
    }

    return readings;
  }

  private async toVehicles(body: unknown): Promise<VendorBVehicle[]> {
    const list = (body as { vehicles?: VendorBVehicle[] }).vehicles;
    if (Array.isArray(list)) {
      return list;
    }

    return [body as VendorBVehicle];
  }

  private async toReading(vehicle: VendorBVehicle): Promise<RobotReading> {
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
