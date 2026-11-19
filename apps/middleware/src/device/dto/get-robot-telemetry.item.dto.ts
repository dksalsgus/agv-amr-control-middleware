export class GetRobotTelemetryItemDto {
  id!: string;
  seq!: number;
  sourceTs!: string;
  receivedTs!: string;
  x!: number;
  y!: number;
  theta!: number;
  speed!: number;
  batteryPct!: number;
  opState!: string;
  errorCode!: string | null;
  loaded!: boolean;
}
