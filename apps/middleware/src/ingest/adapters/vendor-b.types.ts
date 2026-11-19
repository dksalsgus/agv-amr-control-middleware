export type VendorBStatus = "IDLE" | "RUN" | "CHG" | "STOP" | "ERR";

export type VendorBVehicle = {
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
