import { Injectable } from "@nestjs/common";
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

const normalizeDegree = (degree: number) => ((degree % 360) + 360) % 360;

/**
 * 제조사 B: REST JSON. 좌표 mm, 방향 도, 속도 mm/s, 배터리 0~100, 오류 없음은 빈 문자열.
 * 전체 목록({ vehicles: [...] })과 차량 한 대 응답을 모두 받는다.
 */
@Injectable()
export class VendorBAdapter implements VendorAdapter<RestRawMessage> {
  readonly vendorCode = "VENDOR_B";

  toCommon(raw: RestRawMessage): RobotReading[] {
    const vehicles = this.toVehicles(raw.body);

    return vehicles.map((vehicle) => this.toReading(vehicle));
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
      opState: OP_STATE_BY_STATUS[vehicle.status],
      errorCode: vehicle.errorCode === "" ? null : vehicle.errorCode,
      loaded: vehicle.hasLoad,
    };
  }
}
