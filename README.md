# AGV·AMR 통합 관제 미들웨어

제조사마다 통신 방식이 다른 로봇 90대(MQTT, REST, Modbus TCP)와 PLC 신호 16점을 **하나의 공통 모델로 모아 실시간으로 화면에 전달**하는 미들웨어입니다. 연결 설정은 DB에 있어서 재배포 없이 바꿀 수 있습니다.

| 대상         | 수량 | 통신 방식           | 주기  | 미들웨어 입장 |
| ------------ | ---- | ------------------- | ----- | ------------- |
| 제조사 A AMR | 40대 | MQTT (JSON)         | 1초   | 구독 (푸시)   |
| 제조사 B AGV | 30대 | REST                | 1초   | 폴링          |
| 제조사 C AGV | 20대 | Modbus TCP 레지스터 | 1초   | 폴링          |
| PLC 인터록   | 16점 | Modbus TCP          | 500ms | 폴링          |

## 빠른 시작

Docker와 Docker Compose만 있으면 됩니다.

```bash
docker compose up --build
```

PostgreSQL, Redis, MQTT 브로커, 에뮬레이터, 미들웨어, 관제 웹 여섯 컨테이너가 뜹니다. 브라우저에서 http://localhost:8080 을 열고 데모 계정(operator/operator1234)으로 로그인하면 관제 화면이 나옵니다. 미들웨어는 시작할 때 테이블을 만들고(`prisma migrate deploy`) 데모 데이터(제조사, 연결, 장비)를 넣습니다. 시드는 여러 번 실행해도 결과가 같습니다.

| 서비스                | 주소                                     |
| --------------------- | ---------------------------------------- |
| 관제 웹               | http://localhost:8080                    |
| 미들웨어 REST         | http://localhost:3000                    |
| 미들웨어 WebSocket    | ws://localhost:3000/ws                   |
| 에뮬레이터 B (REST)   | http://localhost:8081                    |
| 에뮬레이터 C (Modbus) | localhost:5020                           |
| 에뮬레이터 PLC        | localhost:5021                           |
| 에뮬레이터 장애 주입  | http://localhost:8090/faults             |
| PostgreSQL            | localhost:5432 (middleware / middleware) |
| Redis (이력 저장 큐)  | localhost:6379                           |
| MQTT 브로커           | localhost:1883                           |

### 동작 확인

모든 HTTP 응답은 `{ success, data, error }` 구조입니다. 실패하면 `data`가 null이고 `error`에 상태 코드와 메시지가 담깁니다.

```bash
curl http://localhost:3000/health
# {"success":true,"data":{"status":"ok"},"error":null}

# 데모 계정 로그인 (viewer/viewer1234, operator/operator1234, admin/admin1234)
# health와 login 말고는 모두 토큰이 필요하다 (없거나 틀리면 401). 역할별 기능 차이는 두지 않는다 (docs/design-rationale.md 16장)
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login -H 'content-type: application/json' \
  -d '{"username":"operator","password":"operator1234"}' | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')
AUTH="authorization: Bearer $TOKEN"

# 로봇 90대의 최신 상태 (A 40 + B 30 + C 20). stale=true면 데이터가 끊긴 장비
curl -H "$AUTH" http://localhost:3000/robots
curl -H "$AUTH" http://localhost:3000/robots/{id}

# 로봇 이력 (최신 순, from/to는 ISO 8601, page는 1부터, size는 최대 1000)
curl -H "$AUTH" "http://localhost:3000/robots/{id}/telemetry?from=2026-11-19T00:00:00Z&page=1&size=100"

# PLC 16점의 현재 값과 값이 바뀐 이력
curl -H "$AUTH" http://localhost:3000/plc-points
curl -H "$AUTH" "http://localhost:3000/plc-points/{id}/events?page=1&size=100"

# 연결 목록과 연결 상태 (UP, DOWN, UNKNOWN)
curl -H "$AUTH" http://localhost:3000/connections

# 시스템 로그 (연결 끊김·복구 등, 최신 순, type으로 거를 수 있다)
curl -H "$AUTH" "http://localhost:3000/logs?type=LINK_DOWN&page=1&size=100"

# 지금 열린 알람(최근 순)과 알람 확인 (이미 풀린 알람이면 404)
curl -H "$AUTH" http://localhost:3000/alarms
curl -H "$AUTH" -X POST http://localhost:3000/alarms/{id}/ack

# 측정 스크립트 (Node 22, 의존성 없음, 약 2분 30초, 끝에 에뮬레이터를 다시 켬): 지연 p50·p95, 유실률, 복구 시간, CPU·메모리를 표로 출력
# 장애를 직접 주입했다가 되돌린다. 결과 예시는 docs/measurements.md
node scripts/measure.mjs

# 측정: 연결별 수신·중복·뒤바뀜·유실 건수, 수집 구간 지연 p50·p95, 프로세스 CPU·메모리 (reset으로 구간을 새로 시작)
curl -H "$AUTH" http://localhost:3000/metrics
curl -H "$AUTH" -X POST http://localhost:3000/metrics/reset

# 에뮬레이터 원본 데이터 확인
docker compose exec mosquitto mosquitto_sub -t 'vendorA/amr/+/state' -v
curl http://localhost:8081/api/vehicles
```

### 연결 설정 바꾸기 (재배포 없음)

```bash
# 연결 하나의 설정 보기와 바꾸기 (version이 다르면 409, 잘못된 config는 400)
curl -H "$AUTH" http://localhost:3000/connections/{id}
curl -H "$AUTH" -X PATCH http://localhost:3000/connections/{id} -H 'content-type: application/json' \
  -d '{"version":1,"rest":{"baseUrl":"http://emulator:8081","pollIntervalMs":1000,"mode":"bulk","timeoutMs":800}}'

# 연결 만들기와 지우기 (장비가 딸린 연결은 지우지 않고 enabled=false로 끈다)
curl -H "$AUTH" http://localhost:3000/vendors
curl -H "$AUTH" -X POST http://localhost:3000/connections -H 'content-type: application/json' \
  -d '{"vendorId":"{vendorId}","name":"새 연결","protocol":"REST","rest":{"baseUrl":"http://emulator:8081","pollIntervalMs":1000,"mode":"bulk","timeoutMs":800}}'
curl -H "$AUTH" -X DELETE http://localhost:3000/connections/{id}
```

미들웨어는 2초마다 DB의 연결 설정을 확인해서, `version`이 바뀐 연결만 내렸다가 새 설정으로 다시 붙입니다.

### 장애 확인

```bash
docker compose stop emulator    # B·C·PLC 연결이 DOWN, 장비가 stale=true, logs에 LINK_DOWN
docker compose start emulator   # 1초에서 10초까지 늘어나는 간격으로 재접속해 스스로 UP
docker compose restart middleware  # 이력의 마지막 행으로 로봇 90대와 PLC 16점 상태를 되살림
```

에뮬레이터에 그룹(A, B, C, PLC)별로 장애를 걸 수 있습니다. 미들웨어는 이 설정을 모르고, 받은 데이터만으로 판단합니다.

```bash
curl http://localhost:8090/faults
# B 끊김: 응답 없이 소켓을 닫는다 → 3회 실패 후 LINK_DOWN, B 30대 stale
curl -X PUT http://localhost:8090/faults/B -H 'content-type: application/json' \
  -d '{"disconnected":true,"delayMs":0,"duplicatePct":0,"reorderPct":0,"lossPct":0}'
# C 지연 5초: 5초 전 데이터를 준다 → 연결은 UP, C 20대 stale
curl -X PUT http://localhost:8090/faults/C -H 'content-type: application/json' \
  -d '{"disconnected":false,"delayMs":5000,"duplicatePct":0,"reorderPct":0,"lossPct":0}'
# A 중복 30%·순서 뒤바뀜 30%: 미들웨어가 seq로 걸러 화면의 seq는 뒤로 가지 않는다
curl -X PUT http://localhost:8090/faults/A -H 'content-type: application/json' \
  -d '{"disconnected":false,"delayMs":0,"duplicatePct":30,"reorderPct":30,"lossPct":0}'
# PLC 도어 1(점 0) 열림 → PLC_ABNORMAL 알람. {"on":false}로 풀면 알람 해제
curl -X PUT http://localhost:8090/faults/plc-points/0 -H 'content-type: application/json' -d '{"on":true}'
# 로봇 A-001 오류 → 멈추고 ROBOT_ERROR 알람. {"error":false}로 풀면 해제
curl -X PUT http://localhost:8090/faults/robots/A-001 -H 'content-type: application/json' -d '{"error":true}'
```

| 장애       | A (MQTT 푸시)                     | B·C·PLC (폴링)                             |
| ---------- | --------------------------------- | ------------------------------------------ |
| 끊김       | 발행을 멈춘다                     | REST는 소켓을 닫고, Modbus는 답하지 않는다 |
| 지연 (ms)  | 발생 시각은 그대로 두고 늦게 보냄 | 그만큼 전의 스냅샷을 준다                  |
| 중복 (%)   | 같은 메시지를 두 번 보냄          | 직전에 준 값을 다시 준다                   |
| 뒤바뀜 (%) | 다음 메시지보다 늦게 보냄         | 하나 앞(더 오래된) 스냅샷을 준다           |
| 유실 (%)   | 그 로봇의 메시지를 건너뜀         | REST는 503, Modbus는 예외 응답             |

### 실시간 (WebSocket)

메시지는 `{ "event", "data" }` JSON입니다. `hello`에 로그인 토큰을 실어 보내면 전체 상태(robots, plcPoints, links, alarms)가 오고, 이후 100ms마다 바뀐 것만 옵니다. 풀린 알람은 delta의 `removed`에 kind `ALARM`으로 실립니다.

```bash
npx wscat -c ws://localhost:3000/ws
> {"event":"hello","data":{"token":"<accessToken>"}}
```

## 전체 구조

결정마다 이유와 대안은 [설계 근거](docs/design-rationale.md)에 정리했습니다.

```mermaid
flowchart LR
  subgraph EMU["에뮬레이터 (apps/emulator)"]
    A["제조사 A<br/>AMR 40대"]
    B["제조사 B<br/>AGV 30대<br/>REST :8081"]
    C["제조사 C<br/>AGV 20대<br/>Modbus :5020"]
    P["PLC 16점<br/>Modbus :5021"]
  end

  MQ[("Mosquitto<br/>MQTT 브로커")]

  subgraph MW["미들웨어 (apps/middleware, NestJS)"]
    ING["수집<br/>어댑터 → 공통 모델 → seq 판정"]
    MEM["메모리 현재 상태<br/>+ 전역 rev"]
    API["REST API"]
    WS["WebSocket /ws"]
  end

  DB[("PostgreSQL<br/>설정 + 이력")]
  RQ[("Redis<br/>이력 저장 큐 (BullMQ)")]
  WEB["관제 웹<br/>:8080"]

  A -- "publish 1초" --> MQ -- "subscribe (푸시)" --> ING
  B -- "GET 1초 (폴링)" --> ING
  C -- "레지스터 읽기 1초" --> ING
  P -- "레지스터 읽기 500ms" --> ING
  ING --> MEM
  ING -- "이력 저장 작업" --> RQ -- "작업이 묶음 INSERT" --> DB
  DB -- "연결 설정" --> ING
  MEM --> API
  MEM --> WS
  API <--> WEB
  WS -- "snapshot / delta" --> WEB
```

- 미들웨어는 프로세스 하나입니다. 수집부터 WebSocket 전달까지 함수 호출로 잇습니다.
- **현재 상태는 메모리**, **DB에는 이력만 INSERT**합니다. 서버를 재시작하면 이력의 장비별 마지막 행으로 메모리를 되살립니다.
- 이력 저장만 Redis + BullMQ 작업으로 넘깁니다. DB가 멈추면 작업이 Redis에 쌓였다가 2초 간격으로(최대 30분) 다시 시도되어 빠진 이력이 채워집니다. Redis가 멈추면 그동안의 이력만 빠지고 수집과 화면은 그대로입니다.

### 미들웨어 계층

각 계층은 바로 아래 계층만 부릅니다. 건너뛰기와 같은 계층끼리의 호출은 없습니다.

```mermaid
flowchart TB
  CT["<b>Controller</b><br/>REST Controller · WebSocket Gateway · 폴링 스케줄러"]
  SV["<b>Service</b><br/>수집 · 연결 설정 · 실시간 전달 · 알람 · 조회"]
  PV["<b>Provider</b><br/>제조사 어댑터(A, B, C, PLC) · seq 판정 · STALE 판정 · 연결 상태"]
  RP["<b>Repository</b><br/>MQTT · REST · Modbus 클라이언트 · Prisma · 메모리 상태 저장소"]
  CT --> SV --> PV --> RP
```

### 새 제조사를 추가할 때 바뀌는 범위

제조사 어댑터는 `VendorAdapter` 인터페이스 하나(`toCommon(raw) → RobotReading[]`)를 구현하고, 미들웨어는 `vendors.code`로 어댑터를 찾습니다.

| 경우                           | 바뀌는 것                                                                                                                                                                                                                                                                                                                                             | 바뀌지 않는 것                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 기존 프로토콜을 쓰는 새 제조사 | 미들웨어: 어댑터 class 1개와 테스트, `ingest.module.ts` 등록 1줄, `connection.constants.ts`의 `VENDOR_PROTOCOLS` 1줄. 데이터: `vendors` 행 1개와 장비(`vendors_connections_devices`) 행(장비 등록 API가 없어 SQL·시드로 넣음). 웹: 맵 마커 모양을 정하는 `monitor.constants.ts`의 `VENDOR_KEY_BY_CODE` 1줄(없으면 A 모양으로 그려짐)                  | 프로토콜 클라이언트, seq 판정, 상태, 알람, WebSocket |
| 새 프로토콜을 쓰는 새 제조사   | 위에 더해 미들웨어: 클라이언트 Repository 1개, 접속 정보 DTO 1개와 `device-transport.types.ts`의 설정 타입, `CONNECTION_PROTOCOLS` 1줄, `device-transport.provider.ts`와 `ingest.service.ts`의 프로토콜 분기, `connections.service.ts`의 접속 정보 선택. 웹: 연결 설정 폼의 프로토콜 목록·입력 칸(`connections.constants.ts`, `connections.types.ts`) | seq 판정, 상태, 알람, WebSocket                      |

## 데이터 흐름과 정합성

### 메시지 한 건의 처리

```mermaid
sequenceDiagram
  participant R as Repository<br/>(MQTT·REST·Modbus)
  participant AD as 제조사 어댑터
  participant SQ as seq 판정
  participant M as 메모리 상태
  participant Q as Redis 큐
  participant DB as PostgreSQL
  R->>AD: 원본 (제조사별 필드·단위)
  AD->>SQ: 공통 모델 (m, 도, %, ms)
  alt 받아들임
    SQ->>M: 현재 상태 갱신, rev + 1
    M-->>Q: 이력 저장 작업
    Q-->>DB: 묶음 INSERT (실패하면 다시 시도)
  else 중복 · 늦게 옴
    SQ--xSQ: 버림 (이력에도 넣지 않음)
  end
```

### seq 판정 (장비별)

장비마다 마지막으로 받아들인 `seq`와 `sourceTs`를 기억하고, 새 메시지를 이렇게 판정합니다. 로봇 상태는 **최신값만 의미가 있다**고 보고 늦게 온 과거 위치는 버립니다.

```mermaid
flowchart TD
  N["새 메시지 seq"] --> F{"처음 받음?"}
  F -- 예 --> OK["반영"]
  F -- 아니오 --> E{"seq = 마지막 + 1"}
  E -- 예 --> OK
  E -- 아니오 --> G{"seq > 마지막 + 1"}
  G -- 예 --> GAP["반영, 건너뛴 수를 유실로 셈"]
  G -- 아니오 --> D{"seq = 마지막"}
  D -- 예 --> DUP["중복: 버림"]
  D -- 아니오 --> RS{"sourceTs가 5초 이상 앞섬?"}
  RS -- 예 --> RST["장비 재시작: 반영하고 기준을 다시 잡음"]
  RS -- 아니오 --> OOO["순서 뒤바뀜: 버림"]
```

PLC는 같은 판정을 통과한 뒤, 이전 값과 비트를 비교해 **바뀐 점만** 이벤트로 기록합니다.

### STALE과 연결 끊김

| 판정       | 조건                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| 로봇 STALE | 연결이 DOWN, 또는 3초(주기의 3배) 동안 새 데이터 없음, 또는 지연 3초 초과 |
| PLC STALE  | 연결이 DOWN, 또는 1.5초 동안 새 데이터 없음                               |
| 연결 DOWN  | MQTT는 브로커 연결 종료, REST·Modbus는 3회 연속 실패                      |

연결이 DOWN이 되면 `logs`에 `LINK_DOWN`, 다시 붙으면 `LINK_UP`을 남깁니다. 재접속 간격은 1초에서 10초까지 늘어납니다.

### WebSocket 이어받기 (epoch + rev)

미들웨어는 로봇, PLC 점, 연결을 엔티티로 들고, 바뀔 때마다 **전역 rev**를 1 올려 붙입니다. 화면이 "rev R까지 봤다"고 하면 R 이후 바뀐 엔티티만 보내면 되므로, 처음 접속과 재접속이 같은 코드입니다. **epoch**는 서버가 켜질 때마다 새로 만드는 값이라, epoch가 다르면 rev가 이어지지 않는 것으로 보고 전체 상태를 보냅니다.

```mermaid
sequenceDiagram
  participant W as 화면
  participant S as 미들웨어
  W->>S: hello {}
  S->>W: snapshot {epoch, rev, robots, plcPoints, links, alarms}
  loop 100ms마다 (바뀐 것이 있을 때)
    S->>W: delta {fromRev, rev, 바뀐 엔티티, removed}
  end
  Note over W: delta.fromRev가 내 rev보다 크면 중간을 놓친 것
  W->>S: resync {lastRev}
  S->>W: delta (lastRev 이후 전부)
  Note over W,S: 접속이 끊김
  W->>S: hello {epoch, lastRev}
  alt 같은 epoch
    S->>W: delta (lastRev 이후 바뀐 것만)
  else 서버가 재시작해 epoch가 다름
    S->>W: snapshot (전체 상태)
  end
  loop 5초마다
    S->>W: ping
    W->>S: pong
  end
  Note over S: pong이 2번 연속 없으면 접속을 끊음
```

느린 화면은 전송 버퍼가 1MB를 넘으면 그 프레임을 건너뛰고, 다음 delta가 그 사이 변화를 합쳐서 보냅니다.

## DB 스키마

테이블과 외래키 컬럼은 부모 테이블의 이름을 사슬로 이어 붙입니다(예: `vendors_connections_devices_id`). 이름만 봐도 소속이 보이게 하려는 규칙입니다. 상태 값 컬럼은 DB enum 대신 varchar를 씁니다.

```mermaid
erDiagram
  vendors ||--o{ vendors_connections : ""
  vendors_connections ||--o{ vendors_connections_devices : ""
  vendors_connections_devices ||--o{ vendors_connections_devices_telemetry : ""
  vendors_connections_devices ||--o{ vendors_connections_devices_plc_points : ""
  vendors_connections_devices_plc_points ||--o{ vendors_connections_devices_plc_points_events : ""

  vendors {
    uuid id PK
    text code UK "어댑터를 찾는 키"
    text name
  }
  vendors_connections {
    uuid id PK
    uuid vendors_id FK
    varchar protocol "MQTT, REST, MODBUS_TCP"
    bool enabled
    jsonb config "프로토콜별 접속 정보"
    int version "수정마다 +1"
  }
  vendors_connections_devices {
    uuid id PK
    uuid vendors_connections_id FK
    text external_id "제조사가 부르는 이름"
    varchar type "AMR, AGV, PLC"
  }
  vendors_connections_devices_telemetry {
    bigint id PK
    uuid vendors_connections_devices_id FK
    bigint seq
    timestamptz source_ts
    real x_y_theta_speed
    varchar op_state
  }
  vendors_connections_devices_plc_points {
    uuid id PK
    uuid vendors_connections_devices_id FK
    smallint point_no "0~15"
    bool normal_value
  }
  vendors_connections_devices_plc_points_events {
    bigint id PK
    uuid vendors_connections_devices_plc_points_id FK
    bool value "바뀐 뒤의 값"
    bigint seq
  }
  logs {
    bigint id PK
    varchar type "LINK_UP, LINK_DOWN, ALARM_..."
    varchar alarm_code
    varchar target_type
    uuid target_id
  }
```

- 설정 테이블: `vendors`, `vendors_connections`, `vendors_connections_devices`, `vendors_connections_devices_plc_points`
- 이력 테이블: `..._telemetry`(받아들인 로봇 상태 전부), `..._plc_points_events`(값이 바뀔 때만), `logs`(연결과 알람 기록, 추가만)
- 현재 상태 테이블은 따로 두지 않습니다. 이력의 마지막 행이 곧 현재 값입니다.
- 계정 테이블: `roles`(VIEWER, OPERATOR, ADMIN), `roles_users`(데모 계정, 비밀번호는 argon2id 해시). `logs.roles_users_id`는 알람을 확인한 사용자입니다.

## 과제 요구 사항과 구현

| 과제 요구                                                  | 상태 | 구현                                                                                                                                                                                                       |
| ---------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 필수 1. 에뮬레이터 (90대와 PLC, 끊김·지연·중복·순서 주입)  | 완료 | `apps/emulator`: A 40대 MQTT, B 30대 REST, C 20대 Modbus, PLC 16점. `GET/PUT :8090/faults`로 그룹별 끊김·지연·중복·뒤바뀜·유실 주입. 장애 주입 화면(`/faults`): 그룹별 설정, 시연용 빠른 설정, 전체 초기화 |
| 필수 2. 어댑터 3종과 공통 모델, 새 제조사 추가 범위 증명   | 완료 | `ingest/adapters/vendor-{a,b,c}.adapter.ts`, `plc.adapter.ts`. 범위는 위 "새 제조사" 표                                                                                                                    |
| 필수 3. 연결 설정 (드롭다운·토글, 재배포 없이 변경)        | 완료 | `POST/PATCH/DELETE /connections`, version 충돌 409, config 검증 400. 연결 설정 화면(`/connections`): 프로토콜 드롭다운, 켬·끔 토글, 저장 후 재연결 확인, 409 비교                                          |
| 필수 4. 실시간 전달 (WebSocket, 재접속 복구, 중복·순서)    | 완료 | `/ws` snapshot·delta·resync·ping, epoch와 rev. 수집 구간은 seq 판정                                                                                                                                        |
| 필수 5. 관제 UI (맵, 상태, 연결, PLC, 장애 알림)           | 완료 | 관제 화면(`/`): 공장 맵(Canvas, 90대), 상태 요약, 연결·PLC 패널, 로봇 상세, 열린 알람과 확인, 서버 끊김·복구 표시. 알람 4종(ROBOT_ERROR, DEVICE_STALE, PLC_ABNORMAL, LOW_BATTERY)                          |
| 필수 6. 측정 (지연 p50·p95, 유실률, 복구 시간, CPU·메모리) | 완료 | `node scripts/measure.mjs` 한 번으로 4종 수치가 표로 나옴. 결과는 [docs/measurements.md](docs/measurements.md). 브라우저 종단 지연 p50·p95는 관제 화면 상단 요약에                                         |
| 제출물. `docker compose up` 한 번으로 실행                 | 완료 | `docker-compose.yml`                                                                                                                                                                                       |

## 저장소 구조

```text
apps/
  emulator/      로봇 90대와 PLC를 모사하는 별도 프로세스 (NestJS 없음)
    vendor-a/    MQTT 발행        vendor-b/  REST 서버
    vendor-c/    Modbus 서버      plc/       PLC Modbus 서버
    simulation/  로봇 이동 시뮬레이션
  middleware/    미들웨어 서버 (NestJS)
    prisma/      스키마, 마이그레이션, 시드
    src/
      ingest/    수집: 어댑터, seq 판정, 프로토콜 클라이언트, 폴링 스케줄러
      state/     메모리 현재 상태와 rev
      history/   이력 저장소 (telemetry, plc events, logs)
      settings/  연결 설정 저장소
      connection/ 연결 설정 API
      device/    로봇·PLC 조회 API, STALE 판정
      log/       로그 조회 API
      alarm/     알람 판정과 조회·확인 API
      realtime/  WebSocket
      config/    설정값 (@nestjs/config)
  web/           관제 웹 (React + Vite, 운영은 nginx가 정적 파일과 /api·/ws·/emulator 프록시)
    src/api/     미들웨어 HTTP 클라이언트
    src/auth/    로그인 화면과 토큰
    src/realtime/ WebSocket 클라이언트 (snapshot·delta 반영, 재접속 이어받기)
    src/monitor/ 관제 화면 부품 (맵 그리기, 요약, 패널)
    src/connections/ 연결 설정 화면 부품 (편집 폼, 저장 흐름)
    src/logs/    이력 화면 부품 (필터, 표, 상세)
    src/faults/  장애 주입 화면 부품 (그룹 카드, 빠른 설정)
    src/pages/   화면
infra/mosquitto/ MQTT 브로커 설정
```

## 로컬 개발

Node.js 22와 pnpm 10이 필요합니다.

```bash
pnpm install
pnpm build
pnpm lint
pnpm test
```

관제 웹은 Vite 개발 서버로 띄웁니다. `/api`와 `/ws`를 미들웨어(기본 `http://localhost:3000`, `MIDDLEWARE_URL`로 바꿈)로 넘깁니다.

```bash
pnpm --filter web dev
# http://localhost:5173 (데모 계정 operator/operator1234)
```
