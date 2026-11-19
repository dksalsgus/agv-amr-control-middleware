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
