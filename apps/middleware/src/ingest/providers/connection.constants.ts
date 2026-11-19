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

/**
 * 연결 설정 화면에서 프로토콜을 고르면 미리 채우는 접속 정보. 이 저장소의 에뮬레이터(docker compose) 주소 기준이고,
 * 화면에서 고쳐 저장할 수 있다. 실제 현장에서는 장비 주소에 맞게 바꾼다.
 */
export const VENDOR_CONNECTION_DEFAULTS: Record<
  string,
  Partial<
    Record<(typeof CONNECTION_PROTOCOLS)[number], Record<string, unknown>>
  >
> = {
  VENDOR_A: {
    MQTT: {
      url: "mqtt://mosquitto:1883",
      topicPattern: "vendorA/amr/+/state",
      qos: 1,
    },
  },
  VENDOR_B: {
    REST: {
      baseUrl: "http://emulator:8081",
      pollIntervalMs: 1000,
      mode: "bulk",
      timeoutMs: 800,
    },
    MQTT: {
      url: "mqtt://mosquitto:1883",
      topicPattern: "vendorB/agv/+/state",
      qos: 1,
    },
  },
  VENDOR_C: {
    MODBUS_TCP: {
      host: "emulator",
      port: 5020,
      unitId: 1,
      pollIntervalMs: 1000,
      baseAddress: 100,
      blockSize: 16,
    },
  },
  PLC: {
    MODBUS_TCP: {
      host: "emulator",
      port: 5021,
      unitId: 1,
      pollIntervalMs: 500,
      baseAddress: 0,
      blockSize: 6,
    },
  },
};
