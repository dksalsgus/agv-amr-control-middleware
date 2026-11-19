import { Injectable } from "@nestjs/common";
import { normalizeDegree } from "../../common/utils/angle.util";
import { RobotOpState } from "../../state/robot-state";
import { RestRawMessage } from "../repositories/rest-client.repository";
import { RobotReading, VendorAdapter } from "./vendor-adapter";

type VendorBStatus = "IDLE" | "RUN" | "CHG" | "STOP" | "ERR";

type VendorBVehicle = {
  vehicleId: string;
  sequence: number;
  timestamp: number;
  position: { xMm: number; yMm: number };
  headingDeg: number;
  speedMmS: number;
  batteryLevel: number;
  status: VendorBStatus;
  errorCode: string;
  hasLoad: boolean;
};

const OP_STATE_BY_STATUS: Record<VendorBStatus, RobotOpState> = {
  IDLE: "IDLE",
  RUN: "MOVING",
  CHG: "CHARGING",
  STOP: "PAUSED",
  ERR: "ERROR",
};

/** 제조사 B: REST JSON (mm, 도, mm/s). 전체 목록과 한 대 응답을 모두 받는다. */
@Injectable()
export class VendorBAdapter implements VendorAdapter<RestRawMessage> {
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
      opState: OP_STATE_BY_STATUS[vehicle.status],
      errorCode: vehicle.errorCode === "" ? null : vehicle.errorCode,
      loaded: vehicle.hasLoad,
    };
  }
}
