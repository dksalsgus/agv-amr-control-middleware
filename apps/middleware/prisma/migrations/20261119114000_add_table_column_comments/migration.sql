-- 모든 테이블과 컬럼에 설명을 단다. schema.prisma의 /// 주석과 같은 내용이다.

COMMENT ON TABLE "vendors" IS '제조사. code로 코드의 어댑터 class를 찾는다.';
COMMENT ON COLUMN "vendors"."id" IS '제조사 id';
COMMENT ON COLUMN "vendors"."code" IS '제조사 코드(VENDOR_A, VENDOR_B, VENDOR_C, PLC). 어댑터를 찾는 키';
COMMENT ON COLUMN "vendors"."name" IS '화면에 보이는 제조사 이름';
COMMENT ON COLUMN "vendors"."created_at" IS '행을 만든 시각';
COMMENT ON COLUMN "vendors"."updated_at" IS '행을 마지막으로 고친 시각';

COMMENT ON TABLE "vendors_connections" IS '연결 설정. 행 하나가 어댑터 인스턴스 하나다.';
COMMENT ON COLUMN "vendors_connections"."id" IS '연결 id';
COMMENT ON COLUMN "vendors_connections"."vendors_id" IS '이 연결의 제조사(vendors.id)';
COMMENT ON COLUMN "vendors_connections"."name" IS '화면에 보이는 연결 이름(유일)';
COMMENT ON COLUMN "vendors_connections"."protocol" IS '통신 방식(MQTT, REST, MODBUS_TCP)';
COMMENT ON COLUMN "vendors_connections"."enabled" IS '켜져 있으면 수집한다';
COMMENT ON COLUMN "vendors_connections"."config" IS '프로토콜별 접속 정보(JSON). 형식은 코드의 DTO가 검증한다';
COMMENT ON COLUMN "vendors_connections"."version" IS '저장할 때마다 1씩 오른다. 동시 수정 충돌(409) 감지에 쓴다';
COMMENT ON COLUMN "vendors_connections"."created_at" IS '행을 만든 시각';
COMMENT ON COLUMN "vendors_connections"."updated_at" IS '행을 마지막으로 고친 시각';

COMMENT ON TABLE "vendors_connections_devices" IS '로봇과 PLC 장비. id가 공통 모델의 deviceId다.';
COMMENT ON COLUMN "vendors_connections_devices"."id" IS '장비 id(공통 모델의 deviceId)';
COMMENT ON COLUMN "vendors_connections_devices"."vendors_connections_id" IS '이 장비가 붙은 연결(vendors_connections.id)';
COMMENT ON COLUMN "vendors_connections_devices"."external_id" IS '제조사가 쓰는 장비 번호(시리얼, Modbus 블록 번호 등). 연결 안에서 유일';
COMMENT ON COLUMN "vendors_connections_devices"."type" IS '장비 종류(AMR, AGV, PLC)';
COMMENT ON COLUMN "vendors_connections_devices"."name" IS '화면에 보이는 장비 이름';
COMMENT ON COLUMN "vendors_connections_devices"."enabled" IS '켜져 있으면 수집한다';
COMMENT ON COLUMN "vendors_connections_devices"."created_at" IS '행을 만든 시각';
COMMENT ON COLUMN "vendors_connections_devices"."updated_at" IS '행을 마지막으로 고친 시각';

COMMENT ON TABLE "vendors_connections_devices_telemetry" IS '받아들인 로봇 상태 전부. 초당 90행, 24시간 보관.';
COMMENT ON COLUMN "vendors_connections_devices_telemetry"."id" IS '행 번호';
COMMENT ON COLUMN "vendors_connections_devices_telemetry"."vendors_connections_devices_id" IS '상태를 보낸 로봇(vendors_connections_devices.id)';
COMMENT ON COLUMN "vendors_connections_devices_telemetry"."seq" IS '장비가 붙인 순번. 이보다 작거나 같은 메시지는 버린다';
COMMENT ON COLUMN "vendors_connections_devices_telemetry"."source_ts" IS '장비가 상태를 만든 시각';
COMMENT ON COLUMN "vendors_connections_devices_telemetry"."received_ts" IS '미들웨어가 받은 시각. 보관 기간 정리 기준';
COMMENT ON COLUMN "vendors_connections_devices_telemetry"."x" IS '맵 x 좌표(m)';
COMMENT ON COLUMN "vendors_connections_devices_telemetry"."y" IS '맵 y 좌표(m)';
COMMENT ON COLUMN "vendors_connections_devices_telemetry"."theta" IS '방향(도, 0~360)';
COMMENT ON COLUMN "vendors_connections_devices_telemetry"."speed" IS '속도(m/s)';
COMMENT ON COLUMN "vendors_connections_devices_telemetry"."battery_pct" IS '배터리(%)';
COMMENT ON COLUMN "vendors_connections_devices_telemetry"."op_state" IS '운행 상태(IDLE, MOVING, CHARGING, PAUSED, ERROR)';
COMMENT ON COLUMN "vendors_connections_devices_telemetry"."error_code" IS '오류 코드. 없으면 null';
COMMENT ON COLUMN "vendors_connections_devices_telemetry"."loaded" IS '적재 여부';
COMMENT ON COLUMN "vendors_connections_devices_telemetry"."created_at" IS '행을 만든 시각';
COMMENT ON COLUMN "vendors_connections_devices_telemetry"."updated_at" IS '행을 마지막으로 고친 시각';

COMMENT ON TABLE "vendors_connections_devices_plc_points" IS 'PLC 16점의 의미.';
COMMENT ON COLUMN "vendors_connections_devices_plc_points"."id" IS 'PLC 점 id';
COMMENT ON COLUMN "vendors_connections_devices_plc_points"."vendors_connections_devices_id" IS '이 점이 속한 PLC 장비(vendors_connections_devices.id)';
COMMENT ON COLUMN "vendors_connections_devices_plc_points"."point_no" IS '점 번호(0~15). 입력 레지스터 0의 비트 위치';
COMMENT ON COLUMN "vendors_connections_devices_plc_points"."name" IS '화면에 보이는 점 이름';
COMMENT ON COLUMN "vendors_connections_devices_plc_points"."type" IS '점 종류(DOOR, INTERSECTION, ESTOP, GENERIC)';
COMMENT ON COLUMN "vendors_connections_devices_plc_points"."normal_value" IS '정상일 때의 값';
COMMENT ON COLUMN "vendors_connections_devices_plc_points"."alarm_on_abnormal" IS '정상 값과 다르면 알람을 띄운다';
COMMENT ON COLUMN "vendors_connections_devices_plc_points"."created_at" IS '행을 만든 시각';
COMMENT ON COLUMN "vendors_connections_devices_plc_points"."updated_at" IS '행을 마지막으로 고친 시각';

COMMENT ON TABLE "vendors_connections_devices_plc_points_events" IS 'PLC 점의 값이 바뀔 때만 한 행. 30일 보관.';
COMMENT ON COLUMN "vendors_connections_devices_plc_points_events"."id" IS '행 번호';
COMMENT ON COLUMN "vendors_connections_devices_plc_points_events"."vendors_connections_devices_plc_points_id" IS '값이 바뀐 PLC 점(vendors_connections_devices_plc_points.id)';
COMMENT ON COLUMN "vendors_connections_devices_plc_points_events"."value" IS '바뀐 뒤의 값';
COMMENT ON COLUMN "vendors_connections_devices_plc_points_events"."seq" IS 'PLC가 붙인 순번';
COMMENT ON COLUMN "vendors_connections_devices_plc_points_events"."source_ts" IS 'PLC가 값을 만든 시각';
COMMENT ON COLUMN "vendors_connections_devices_plc_points_events"."received_ts" IS '미들웨어가 받은 시각. 보관 기간 정리 기준';
COMMENT ON COLUMN "vendors_connections_devices_plc_points_events"."created_at" IS '행을 만든 시각';
COMMENT ON COLUMN "vendors_connections_devices_plc_points_events"."updated_at" IS '행을 마지막으로 고친 시각';

COMMENT ON TABLE "logs" IS '연결 기록, 알람, 설정 변경을 쌓는 시스템 로그. 추가만 한다. 30일 보관.';
COMMENT ON COLUMN "logs"."id" IS '행 번호';
COMMENT ON COLUMN "logs"."type" IS '로그 종류(LINK_UP, LINK_DOWN, ALARM_RAISED, ALARM_CLEARED, ALARM_ACKED, CONFIG_CHANGED)';
COMMENT ON COLUMN "logs"."level" IS '심각도(INFO, WARN, CRITICAL)';
COMMENT ON COLUMN "logs"."alarm_code" IS '알람 코드. 알람 로그일 때만';
COMMENT ON COLUMN "logs"."target_type" IS '대상 종류(CONNECTION, DEVICE, PLC_POINT)';
COMMENT ON COLUMN "logs"."target_id" IS '대상 id(연결, 장비, PLC 점)';
COMMENT ON COLUMN "logs"."message" IS '화면에 보이는 설명';
COMMENT ON COLUMN "logs"."users_id" IS '알람을 확인하거나 연결 설정을 바꾼 사용자(users.id). ALARM_ACKED, CONFIG_CHANGED일 때만';
COMMENT ON COLUMN "logs"."created_at" IS '행을 만든 시각';
COMMENT ON COLUMN "logs"."updated_at" IS '행을 마지막으로 고친 시각';

COMMENT ON TABLE "roles" IS '권한 역할. code는 VIEWER(조회), OPERATOR(알람 확인), ADMIN(연결 설정 변경)';
COMMENT ON COLUMN "roles"."id" IS '역할 id';
COMMENT ON COLUMN "roles"."code" IS '역할 코드(VIEWER, OPERATOR, ADMIN)';
COMMENT ON COLUMN "roles"."name" IS '화면에 보이는 역할 이름';
COMMENT ON COLUMN "roles"."created_at" IS '행을 만든 시각';
COMMENT ON COLUMN "roles"."updated_at" IS '행을 마지막으로 고친 시각';

COMMENT ON TABLE "users" IS '데모 계정. 역할은 user_roles로 잇는다.';
COMMENT ON COLUMN "users"."id" IS '사용자 id';
COMMENT ON COLUMN "users"."username" IS '로그인 아이디(유일)';
COMMENT ON COLUMN "users"."password_hash" IS '비밀번호 해시(argon2id)';
COMMENT ON COLUMN "users"."created_at" IS '행을 만든 시각';
COMMENT ON COLUMN "users"."updated_at" IS '행을 마지막으로 고친 시각';

COMMENT ON TABLE "user_roles" IS '사용자와 역할의 매핑. 한 사용자가 여러 역할을 가질 수 있다.';
COMMENT ON COLUMN "user_roles"."users_id" IS '사용자(users.id)';
COMMENT ON COLUMN "user_roles"."roles_id" IS '역할(roles.id)';
COMMENT ON COLUMN "user_roles"."created_at" IS '행을 만든 시각';
COMMENT ON COLUMN "user_roles"."updated_at" IS '행을 마지막으로 고친 시각';
