import { RobotState } from "../../state/robot-state";

/** 어댑터 출력. 장비는 제조사 식별자(externalId)로 구분한다. */
export type RobotReading = Omit<RobotState, "receivedTs"> & {
  externalId: string;
};

/** 제조사 어댑터 계약. vendors.code로 찾는다. */
export interface VendorAdapter<TRaw> {
  readonly vendorCode: string;
  toCommon(raw: TRaw): Promise<RobotReading[]>;
}

export const VENDOR_ADAPTERS = Symbol("VENDOR_ADAPTERS");
