export const MAP_WIDTH_M = 50;
export const MAP_HEIGHT_M = 30;

export const MQTT_URL = process.env.MQTT_URL ?? "mqtt://localhost:1883";
export const VENDOR_A_ROBOT_COUNT = Number(process.env.VENDOR_A_COUNT ?? 40);
export const VENDOR_A_PUBLISH_INTERVAL_MS = 1000;

export const VENDOR_B_ROBOT_COUNT = Number(process.env.VENDOR_B_COUNT ?? 30);
export const VENDOR_B_PORT = Number(process.env.VENDOR_B_PORT ?? 8081);
export const VENDOR_B_STEP_INTERVAL_MS = 1000;
