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
