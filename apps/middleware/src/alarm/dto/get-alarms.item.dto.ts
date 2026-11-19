export class GetAlarmsItemDto {
  id!: string;
  code!: string;
  level!: string;
  targetType!: string;
  targetId!: string;
  message!: string;
  raisedAt!: string;
  ackedAt!: string | null;
  rev!: number;
}
