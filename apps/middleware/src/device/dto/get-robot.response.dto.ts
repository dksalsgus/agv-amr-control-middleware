export class GetRobotStateDto {
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

export class GetRobotResponseDto {
  id!: string;
  connectionId!: string;
  externalId!: string;
  name!: string;
  type!: string;
  rev!: number;
  state!: GetRobotStateDto | null;
}
