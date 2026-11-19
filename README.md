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
```

## 로컬 개발

Node.js 22와 pnpm 10이 필요합니다.

```bash
pnpm install
pnpm build
pnpm lint
```
