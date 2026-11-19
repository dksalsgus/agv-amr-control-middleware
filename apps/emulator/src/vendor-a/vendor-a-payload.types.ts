/** 제조사 A의 MQTT JSON 형식 (설계 문서 4장 로봇 매핑표 A열) */
export type VendorAPayload = {
  seq: number;
  ts: string;
  pose: { x: number; y: number; theta: number };
  velocity: number;
  battery: { soc: number };
  mode: "idle" | "driving" | "charging" | "paused" | "fault";
  fault: { code: string } | null;
  payload: { loaded: boolean };
};
