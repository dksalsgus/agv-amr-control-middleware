export class GetLogsItemDto {
  id!: string;
  type!: string;
  level!: string;
  alarmCode!: string | null;
  targetType!: string;
  targetId!: string;
  message!: string;
  /** 알람을 확인하거나 연결 설정을 바꾼 사용자. ALARM_ACKED, CONFIG_CHANGED일 때만 */
  rolesUsersId!: string | null;
  createdAt!: string;
}
