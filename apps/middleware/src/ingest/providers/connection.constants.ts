export const CONNECTION_PROTOCOLS = ["MQTT", "REST", "MODBUS_TCP"] as const;

/**
 * 제조사(vendors.code)별로 장비가 보내고 어댑터가 읽을 수 있는 프로토콜.
 * 제조사가 프로토콜을 더 지원하면 그 어댑터를 만들고 여기에 더한다.
 */
export const VENDOR_PROTOCOLS: Record<
  string,
  readonly (typeof CONNECTION_PROTOCOLS)[number][]
> = {
  VENDOR_A: ["MQTT"],
  VENDOR_B: ["REST", "MQTT"],
  VENDOR_C: ["MODBUS_TCP"],
  PLC: ["MODBUS_TCP"],
};
