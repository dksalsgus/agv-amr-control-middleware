export const MAP_WIDTH_M = 50;
export const MAP_HEIGHT_M = 30;

export const MQTT_URL = process.env.MQTT_URL ?? "mqtt://localhost:1883";
export const VENDOR_A_ROBOT_COUNT = Number(process.env.VENDOR_A_COUNT ?? 40);
export const VENDOR_A_PUBLISH_INTERVAL_MS = 1000;

export const VENDOR_B_ROBOT_COUNT = Number(process.env.VENDOR_B_COUNT ?? 30);
export const VENDOR_B_PORT = Number(process.env.VENDOR_B_PORT ?? 8081);
export const VENDOR_B_STEP_INTERVAL_MS = 1000;

export const VENDOR_C_ROBOT_COUNT = Number(process.env.VENDOR_C_COUNT ?? 20);
export const VENDOR_C_PORT = Number(process.env.VENDOR_C_PORT ?? 5020);
export const VENDOR_C_STEP_INTERVAL_MS = 1000;
/** 차량 n의 레지스터 블록 시작 주소 = 100 + 16n (설계 문서 4장) */
export const VENDOR_C_BASE_ADDRESS = 100;
export const VENDOR_C_BLOCK_SIZE = 16;

export const FAULT_PORT = Number(process.env.FAULT_PORT ?? 8090);

export const PLC_PORT = Number(process.env.PLC_PORT ?? 5021);
export const PLC_STEP_INTERVAL_MS = 500;
export const PLC_POINT_COUNT = 16;
