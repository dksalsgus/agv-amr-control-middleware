-- 데모 시드. 여러 번 실행해도 같은 결과가 되도록 충돌 시 건너뛴다.

-- 제조사 A: MQTT로 상태를 푸시하는 AMR 40대
INSERT INTO vendors (id, code, name)
VALUES (gen_random_uuid(), 'VENDOR_A', '제조사 A')
ON CONFLICT (code) DO NOTHING;

INSERT INTO vendors_connections (id, vendors_id, name, protocol, config)
SELECT gen_random_uuid(), v.id, '제조사 A MQTT', 'MQTT',
  '{"url":"mqtt://mosquitto:1883","topicPattern":"vendorA/amr/+/state","qos":1,"username":null,"password":null}'::jsonb
FROM vendors v
WHERE v.code = 'VENDOR_A'
ON CONFLICT (name) DO NOTHING;

INSERT INTO vendors_connections_devices (id, vendors_connections_id, external_id, type, name)
SELECT gen_random_uuid(), c.id, 'A-' || lpad(n::text, 3, '0'), 'AMR', 'AMR A-' || lpad(n::text, 3, '0')
FROM vendors_connections c, generate_series(1, 40) AS n
WHERE c.name = '제조사 A MQTT'
ON CONFLICT (vendors_connections_id, external_id) DO NOTHING;

-- 제조사 B: REST로 폴링하는 AGV 30대
INSERT INTO vendors (id, code, name)
VALUES (gen_random_uuid(), 'VENDOR_B', '제조사 B')
ON CONFLICT (code) DO NOTHING;

INSERT INTO vendors_connections (id, vendors_id, name, protocol, config)
SELECT gen_random_uuid(), v.id, '제조사 B REST', 'REST',
  '{"baseUrl":"http://emulator:8081","pollIntervalMs":1000,"mode":"bulk","timeoutMs":800}'::jsonb
FROM vendors v
WHERE v.code = 'VENDOR_B'
ON CONFLICT (name) DO NOTHING;

INSERT INTO vendors_connections_devices (id, vendors_connections_id, external_id, type, name)
SELECT gen_random_uuid(), c.id, 'B-' || lpad(n::text, 3, '0'), 'AGV', 'AGV B-' || lpad(n::text, 3, '0')
FROM vendors_connections c, generate_series(1, 30) AS n
WHERE c.name = '제조사 B REST'
ON CONFLICT (vendors_connections_id, external_id) DO NOTHING;

-- 제조사 C: Modbus TCP로 폴링하는 AGV 20대. external_id는 레지스터 블록 번호(0부터)
INSERT INTO vendors (id, code, name)
VALUES (gen_random_uuid(), 'VENDOR_C', '제조사 C')
ON CONFLICT (code) DO NOTHING;

INSERT INTO vendors_connections (id, vendors_id, name, protocol, config)
SELECT gen_random_uuid(), v.id, '제조사 C Modbus', 'MODBUS_TCP',
  '{"host":"emulator","port":5020,"unitId":1,"pollIntervalMs":1000,"baseAddress":100,"blockSize":16}'::jsonb
FROM vendors v
WHERE v.code = 'VENDOR_C'
ON CONFLICT (name) DO NOTHING;

INSERT INTO vendors_connections_devices (id, vendors_connections_id, external_id, type, name)
SELECT gen_random_uuid(), c.id, n::text, 'AGV', 'AGV C-' || lpad((n + 1)::text, 3, '0')
FROM vendors_connections c, generate_series(0, 19) AS n
WHERE c.name = '제조사 C Modbus'
ON CONFLICT (vendors_connections_id, external_id) DO NOTHING;

-- PLC 인터록: Modbus TCP로 폴링하는 PLC 1대, 16점
INSERT INTO vendors (id, code, name)
VALUES (gen_random_uuid(), 'PLC', 'PLC 인터록')
ON CONFLICT (code) DO NOTHING;

INSERT INTO vendors_connections (id, vendors_id, name, protocol, config)
SELECT gen_random_uuid(), v.id, 'PLC Modbus', 'MODBUS_TCP',
  '{"host":"emulator","port":5021,"unitId":1,"pollIntervalMs":500,"baseAddress":0,"blockSize":6}'::jsonb
FROM vendors v
WHERE v.code = 'PLC'
ON CONFLICT (name) DO NOTHING;

INSERT INTO vendors_connections_devices (id, vendors_connections_id, external_id, type, name)
SELECT gen_random_uuid(), c.id, '0', 'PLC', 'PLC 1'
FROM vendors_connections c
WHERE c.name = 'PLC Modbus'
ON CONFLICT (vendors_connections_id, external_id) DO NOTHING;

INSERT INTO vendors_connections_devices_plc_points
  (id, vendors_connections_devices_id, point_no, name, type, normal_value, alarm_on_abnormal)
SELECT gen_random_uuid(), d.id, p.point_no, p.name, p.type, false, p.alarm
FROM vendors_connections_devices d
JOIN vendors_connections c ON c.id = d.vendors_connections_id
CROSS JOIN (VALUES
  (0, '도어 1 열림', 'DOOR', true),
  (1, '도어 2 열림', 'DOOR', true),
  (2, '도어 3 열림', 'DOOR', true),
  (3, '도어 4 열림', 'DOOR', true),
  (4, '교차로 1 점유', 'INTERSECTION', false),
  (5, '교차로 2 점유', 'INTERSECTION', false),
  (6, '교차로 3 점유', 'INTERSECTION', false),
  (7, '교차로 4 점유', 'INTERSECTION', false),
  (8, '비상정지 1', 'ESTOP', true),
  (9, '비상정지 2', 'ESTOP', true),
  (10, '신호 11', 'GENERIC', false),
  (11, '신호 12', 'GENERIC', false),
  (12, '신호 13', 'GENERIC', false),
  (13, '신호 14', 'GENERIC', false),
  (14, '신호 15', 'GENERIC', false),
  (15, '신호 16', 'GENERIC', false)
) AS p(point_no, name, type, alarm)
WHERE c.name = 'PLC Modbus' AND d.external_id = '0'
ON CONFLICT (vendors_connections_devices_id, point_no) DO NOTHING;

-- 역할 3종과 데모 계정 (비밀번호는 아이디 + 1234, argon2id 해시)
INSERT INTO roles (id, code, name)
VALUES
  (gen_random_uuid(), 'VIEWER', '조회'),
  (gen_random_uuid(), 'OPERATOR', '운영자'),
  (gen_random_uuid(), 'ADMIN', '관리자')
ON CONFLICT (code) DO NOTHING;

INSERT INTO roles_users (id, roles_id, username, password_hash)
SELECT gen_random_uuid(), r.id, u.username, u.password_hash
FROM (VALUES
  ('VIEWER', 'viewer', '$argon2id$v=19$m=65536,p=4,t=3$msVivQ5v1U7AZaQ/b5in/w$NtJUy+L/0i4i85VTbRPEeUaflB426Ua93o1l9Y50C8c'),
  ('OPERATOR', 'operator', '$argon2id$v=19$m=65536,p=4,t=3$NKNvCQVm+WTs0z0H8/fnmw$IWyj/JlV6TmJiXo4N2hFDoyCPfblN0VzWV53YvVI+R0'),
  ('ADMIN', 'admin', '$argon2id$v=19$m=65536,p=4,t=3$LVq4iZB3ga0EXtiypQ/qHA$43pHwwGOVfseU09lmJAmTT9cFuWWD8BAPmQZkFZdgM0')
) AS u(roles_code, username, password_hash)
JOIN roles r ON r.code = u.roles_code
ON CONFLICT (username) DO NOTHING;
