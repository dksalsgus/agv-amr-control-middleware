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
