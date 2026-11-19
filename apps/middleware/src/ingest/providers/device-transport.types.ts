/** vendors_connections.config의 MQTT 모양 */
export type MqttConnectionConfig = {
  url: string;
  topicPattern: string;
  qos: 0 | 1 | 2;
  username: string | null;
  password: string | null;
};

/** vendors_connections.config의 REST 모양 */
export type RestConnectionConfig = {
  baseUrl: string;
  pollIntervalMs: number;
  mode: "bulk" | "each";
  timeoutMs: number;
};

/** vendors_connections.config의 MODBUS_TCP 모양 */
export type ModbusConnectionConfig = {
  host: string;
  port: number;
  unitId: number;
  pollIntervalMs: number;
  baseAddress: number;
  blockSize: number;
};

/** 한 번 읽은 결과. firstBlock부터 연속된 블록의 레지스터 */
export type ModbusRawMessage = {
  firstBlock: number;
  blockSize: number;
  registers: number[];
};
