-- 로그 종류에 PLC_WRITE(관제에서 PLC 점 값을 씀)를 더해 설명을 고친다.
COMMENT ON COLUMN "logs"."type" IS '로그 종류(LINK_UP, LINK_DOWN, ALARM_RAISED, ALARM_CLEARED, ALARM_ACKED, CONFIG_CHANGED, PLC_WRITE)';
COMMENT ON COLUMN "logs"."users_id" IS '알람을 확인하거나 연결 설정을 바꾸거나 PLC 값을 쓴 사용자(users.id). ALARM_ACKED, CONFIG_CHANGED, PLC_WRITE일 때만';
