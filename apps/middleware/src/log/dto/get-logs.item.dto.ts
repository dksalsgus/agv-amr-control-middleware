export class GetLogsItemDto {
  id!: string;
  type!: string;
  level!: string;
  alarmCode!: string | null;
  targetType!: string;
  targetId!: string;
  message!: string;
  createdAt!: string;
}
