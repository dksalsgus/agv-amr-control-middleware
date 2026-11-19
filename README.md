# AGV·AMR 통합 관제 미들웨어

제조사와 통신 방식이 다른 로봇(MQTT, REST, Modbus TCP)과 PLC 신호를 하나의 공통 모델로 모아 실시간으로 전달하는 미들웨어입니다.

## 구성

| 경로              | 설명                        |
| ----------------- | --------------------------- |
| `apps/middleware` | 미들웨어 서버 (NestJS)      |
| `infra/mosquitto` | 제조사 A용 MQTT 브로커 설정 |

## 실행

Docker와 Docker Compose가 필요합니다.

```bash
docker compose up --build
```

| 서비스      | 주소                                     |
| ----------- | ---------------------------------------- |
| 미들웨어    | http://localhost:3000                    |
| PostgreSQL  | localhost:5432 (middleware / middleware) |
| MQTT 브로커 | localhost:1883                           |

동작 확인:

```bash
curl http://localhost:3000/health
# {"status":"ok"}

# 제조사 A 로봇 40대의 MQTT 메시지 (1초마다 seq가 오른다)
docker compose exec mosquitto mosquitto_sub -t 'vendorA/amr/+/state' -v

# 제조사 B 로봇 30대의 REST 응답 (미들웨어가 1초마다 폴링한다)
curl http://localhost:8081/api/vehicles

# 미들웨어가 모은 로봇의 최신 상태 (A 40대 + B 30대 + C 20대)
curl http://localhost:3000/robots
curl http://localhost:3000/robots/{id}

# 로봇 이력 (최신 순, from/to는 ISO 8601, page는 1부터, size는 최대 1000)
curl "http://localhost:3000/robots/{id}/telemetry?from=2026-11-19T00:00:00Z&page=1&size=100"
```

시작할 때 `prisma migrate deploy`로 테이블을 만들고 `prisma/seed.sql`로 데모 데이터(제조사, 연결, 장비)를 넣습니다. 시드는 여러 번 실행해도 결과가 같습니다.

## 로컬 개발

Node.js 22와 pnpm 10이 필요합니다.

```bash
pnpm install
pnpm build
pnpm lint
```
