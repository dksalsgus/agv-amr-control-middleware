export class GetPlcPointsItemDto {
  id!: string;
  deviceId!: string;
  pointNo!: number;
  name!: string;
  type!: string;
  normalValue!: boolean;
  alarmOnAbnormal!: boolean;
  value!: boolean | null;
  abnormal!: boolean;
  changedAt!: string | null;
  rev!: number;
}

export class GetPlcPointsResponseDto {
  plcPoints!: GetPlcPointsItemDto[];
}
