export type ModbusReadCallback = (
  error: Error | null,
  values: number[],
) => void;
