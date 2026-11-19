export class GetLogsItemDto {
  id!: string;
  type!: string;
  level!: string;
  alarmCode!: string | null;
  targetType!: string;
  targetId!: string;
  message!: string;
  /** 알람을 확인하거나 연결 설정을 바꾸거나 PLC 값을 쓴 사용자. ALARM_ACKED, CONFIG_CHANGED, PLC_WRITE일 때만 */
  usersId!: string | null;
  createdAt!: string;
}
