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
