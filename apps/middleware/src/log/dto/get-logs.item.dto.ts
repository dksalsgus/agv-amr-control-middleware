export class GetLogsItemDto {
  id!: string;
  type!: string;
  level!: string;
  alarmCode!: string | null;
  targetType!: string;
  targetId!: string;
  message!: string;
  /** 알람을 확인한 사용자. ALARM_ACKED일 때만 */
  rolesUsersId!: string | null;
  createdAt!: string;
}
