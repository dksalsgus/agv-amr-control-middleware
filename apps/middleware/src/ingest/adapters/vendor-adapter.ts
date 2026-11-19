import { RobotState } from "../../state/robot-state";

/** 어댑터가 내놓는 공통 모델. 장비는 아직 제조사가 부르는 이름(externalId)으로 식별한다. */
export type RobotReading = Omit<RobotState, "receivedTs"> & {
  externalId: string;
};

/**
 * 제조사 어댑터 계약. 미들웨어는 vendors.code로 어댑터를 찾는다(설계 문서 3장).
 */
export interface VendorAdapter<TRaw> {
  readonly vendorCode: string;
  toCommon(raw: TRaw): RobotReading[];
}

export const VENDOR_ADAPTERS = Symbol("VENDOR_ADAPTERS");
