export class GetRobotsStateDto {
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

export class GetRobotsItemDto {
  id!: string;
  connectionId!: string;
  externalId!: string;
  name!: string;
  type!: string;
  rev!: number;
  stale!: boolean;
  state!: GetRobotsStateDto | null;
}

export class GetRobotsResponseDto {
  robots!: GetRobotsItemDto[];
}
