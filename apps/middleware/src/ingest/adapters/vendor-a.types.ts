export type VendorAMode = "idle" | "driving" | "charging" | "paused" | "fault";

export type VendorAPayload = {
  seq: number;
  ts: string;
  pose: { x: number; y: number; theta: number };
  velocity: number;
  battery: { soc: number };
  mode: VendorAMode;
  fault: { code: string } | null;
  payload: { loaded: boolean };
};
