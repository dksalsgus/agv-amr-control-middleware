# 인터페이스 명세

미들웨어의 REST API와 WebSocket, 에뮬레이터의 장애 주입 API입니다. 기준은 `main`의 코드이고, 필드 정의는 `apps/middleware/src/*/dto`에 있습니다.

## 1. 공통 규칙

### 응답 구조

모든 HTTP 응답은 같은 구조입니다.

```json
{ "success": true, "data": { "...": "..." }, "error": null }
```

실패하면 `data`가 null이고 `error`가 채워집니다. 입력 검증 실패는 `message`가 배열입니다.

```json
{
  "success": false,
  "data": null,
  "error": {
    "statusCode": 409,
    "message": "다른 곳에서 먼저 고쳤습니다. 새로 불러온 뒤 다시 시도하세요.",
    "path": "/connections/5b1e...",
    "timestamp": "2026-11-19T05:00:00.000Z"
  }
}
```

### 인증

`POST /auth/login`으로 받은 `accessToken`을 `Authorization: Bearer <토큰>` 헤더에 실어 보냅니다. `/health`와 `/auth/login`만 토큰 없이 부를 수 있습니다. 역할(VIEWER, OPERATOR, ADMIN)에 따른 기능 차이는 두지 않습니다([설계 근거 16장](design-rationale.md#16-로그인은-구현-역할별-기능-차이는-설계만)).

### 오류 코드

| 코드 | 언제                                                                     |
| ---- | ------------------------------------------------------------------------ |
| 400  | 입력 검증 실패, protocol과 맞지 않는 config, 없는 제조사                 |
| 401  | 토큰이 없거나 틀렸거나 만료됨, 아이디나 비밀번호가 틀림                  |
| 404  | 없는 연결·로봇·PLC 점, 이미 풀린 알람                                    |
| 409  | 연결 수정 시 `version`이 다름, 이름이 겹침, 장비가 딸린 연결을 지우려 함 |

### 목록과 시각

- 목록 API는 `page`(1부터, 기본 1)와 `size`(1~1000, 기본 100)를 받고 `{ items, page, size, total }`을 돌려줍니다. 정렬은 최신 순입니다.
- 시각은 모두 ISO 8601 문자열(UTC)입니다. `from`, `to` 쿼리도 같은 형식입니다.
- 단위: 위치 m, 방향 도(0~360), 속도 m/s, 배터리 %, 시간 ms.

## 2. REST API

| 메서드 | 경로                      | 하는 일                              |
| ------ | ------------------------- | ------------------------------------ |
| GET    | `/health`                 | 살아 있는지 확인 (토큰 없음)         |
| POST   | `/auth/login`             | 로그인, 토큰 발급 (토큰 없음)        |
| GET    | `/robots`                 | 로봇 90대의 현재 상태                |
| GET    | `/robots/{id}`            | 로봇 하나의 현재 상태                |
| GET    | `/robots/{id}/telemetry`  | 로봇 이력 (목록)                     |
| GET    | `/plc-points`             | PLC 16점의 현재 값                   |
| GET    | `/plc-points/{id}/events` | PLC 점의 값 변화 이력 (목록)         |
| GET    | `/vendors`                | 제조사 목록 (연결 만들 때 고르는 값) |
| GET    | `/connections`            | 연결 목록과 연결 상태                |
| GET    | `/connections/{id}`       | 연결 하나의 설정                     |
| POST   | `/connections`            | 연결 만들기                          |
| PATCH  | `/connections/{id}`       | 연결 설정 바꾸기 (재배포 없음)       |
| DELETE | `/connections/{id}`       | 연결 지우기                          |
| GET    | `/alarms`                 | 지금 열린 알람                       |
| POST   | `/alarms/{id}/ack`        | 알람 확인                            |
| GET    | `/logs`                   | 시스템 로그 (목록)                   |
| GET    | `/metrics`                | 측정값 (지연, 유실, CPU·메모리)      |
| POST   | `/metrics/reset`          | 측정값 초기화                        |

### 로그인

```http
POST /auth/login
{ "username": "admin", "password": "admin1234" }
```

```json
{
  "accessToken": "eyJ...",
  "expiresIn": 43200,
  "username": "admin",
  "role": "ADMIN"
}
```

데모 계정은 `viewer/viewer1234`, `operator/operator1234`, `admin/admin1234`입니다. 틀리면 401입니다.

### 로봇

`GET /robots` → `{ robots: Robot[] }`, `GET /robots/{id}` → `Robot`

```json
{
  "id": "a522...",
  "connectionId": "d722...",
  "externalId": "A-001",
  "name": "AMR A-001",
  "type": "AMR",
  "rev": 3452,
  "stale": false,
  "state": {
    "seq": 43,
    "sourceTs": "2026-11-19T03:46:54.634Z",
    "receivedTs": "2026-11-19T03:46:54.635Z",
    "x": 30.85,
    "y": 17.68,
    "theta": 67.6,
    "speed": 1,
    "batteryPct": 89,
    "opState": "MOVING",
    "errorCode": null,
    "loaded": true
  }
}
```

- `type`: `AMR`, `AGV`. `opState`: `IDLE`, `MOVING`, `CHARGING`, `PAUSED`, `ERROR`.
- `state`는 아직 한 번도 받지 못한 로봇이면 null입니다. `stale`은 [설계 근거 7장](design-rationale.md#7-stale은-주기의-3배-무소식)의 판정입니다.
- `GET /robots/{id}/telemetry?from&to&page&size` → `{ items: (state + id)[], page, size, total }`

### PLC 점

`GET /plc-points` → `{ plcPoints: PlcPoint[] }`

```json
{
  "id": "5c61...",
  "deviceId": "bb3c...",
  "pointNo": 0,
  "name": "도어 1 열림",
  "type": "DOOR",
  "normalValue": false,
  "alarmOnAbnormal": true,
  "value": true,
  "abnormal": true,
  "changedAt": "2026-11-19T03:46:24.134Z",
  "stale": false,
  "rev": 120
}
```

- `type`: `DOOR`, `INTERSECTION`, `ESTOP`, `GENERIC`. `abnormal`은 `value !== normalValue`입니다.
- `GET /plc-points/{id}/events?from&to&page&size` → `{ items: { id, value, seq, sourceTs, receivedTs }[], page, size, total }`

### 연결 설정

`GET /connections` → `{ connections: Connection[] }`

```json
{
  "id": "8a6a...",
  "name": "제조사 B REST",
  "vendorCode": "VENDOR_B",
  "vendorName": "제조사 B",
  "protocol": "REST",
  "enabled": true,
  "version": 1,
  "deviceCount": 30,
  "linkStatus": "UP",
  "linkChangedAt": "2026-11-19T03:46:18.109Z"
}
```

`GET /connections/{id}`는 위에 `config`와 `hasPassword`를 더합니다. 비밀번호는 내보내지 않습니다.

`protocol`마다 config 필드가 다릅니다. 요청에는 protocol에 맞는 키(`mqtt`, `rest`, `modbus`) 하나만 보냅니다.

| protocol     | 키       | 필드 (검증 범위)                                                                                                     |
| ------------ | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `MQTT`       | `mqtt`   | `url`(mqtt:// 또는 mqtts://), `topicPattern`, `qos`(0·1·2), `username`, `password`(빼면 저장된 값 유지)              |
| `REST`       | `rest`   | `baseUrl`(http·https), `pollIntervalMs`(200~60000), `mode`(`bulk` 전체 한 번, `each` 차량별), `timeoutMs`(100~30000) |
| `MODBUS_TCP` | `modbus` | `host`, `port`(1~65535), `unitId`(0~255), `pollIntervalMs`(100~60000), `baseAddress`(0~65535), `blockSize`(1~125)    |

```http
POST /connections
{ "vendorId": "48b3...", "name": "새 연결", "protocol": "REST", "enabled": true,
  "rest": { "baseUrl": "http://emulator:8081", "pollIntervalMs": 1000, "mode": "bulk", "timeoutMs": 800 } }
→ { "id": "...", "version": 1 }

PATCH /connections/{id}
{ "version": 1, "enabled": false }
{ "version": 1, "modbus": { "host": "emulator", "port": 5020, "unitId": 1, "pollIntervalMs": 1000, "baseAddress": 100, "blockSize": 16 } }
→ { "id": "...", "version": 2 }
```

- PATCH는 `version`이 필수이고, 저장된 값과 다르면 409입니다. `name`, `enabled`, `protocol`, config는 바꿀 것만 보냅니다. `protocol`을 바꾸면 그 프로토콜의 config도 같이 보내야 합니다(없으면 400).
- 제조사 장비가 보내지 않는 프로토콜은 POST와 PATCH 모두 400입니다(예: 제조사 A는 MQTT만). 제조사 B는 REST와 MQTT를 모두 보내서, 연결 설정에서 `{ "protocol": "MQTT", "mqtt": { "url": "mqtt://mosquitto:1883", "topicPattern": "vendorB/agv/+/state", "qos": 1 } }`로 바꾸면 재시작 없이 MQTT로 계속 받습니다. 지원 목록은 `VENDOR_PROTOCOLS`에 있고, 제조사가 프로토콜을 더 지원하면 어댑터를 만들고 목록에 더합니다.
- 바뀐 설정은 2초 안에 수집에 반영되고, 그 연결만 다시 붙습니다.
- DELETE는 장비가 딸린 연결이면 409입니다. 이때는 `enabled: false`로 끕니다. 성공하면 `data`가 null입니다.

### 알람

`GET /alarms` → `{ alarms: Alarm[] }` (최근 순)

```json
{
  "id": "c1f0...",
  "code": "PLC_ABNORMAL",
  "level": "CRITICAL",
  "targetType": "PLC_POINT",
  "targetId": "5c61...",
  "message": "도어 1 열림 비정상",
  "raisedAt": "2026-11-19T03:46:24.200Z",
  "ackedAt": null,
  "rev": 121
}
```

| code           | level    | 열리는 조건                                                            |
| -------------- | -------- | ---------------------------------------------------------------------- |
| `ROBOT_ERROR`  | CRITICAL | 로봇 `opState`가 `ERROR`                                               |
| `PLC_ABNORMAL` | CRITICAL | `alarmOnAbnormal`인 PLC 점의 값이 비정상                               |
| `DEVICE_STALE` | WARN     | 로봇이나 PLC가 STALE (연결 판정 전에는 열지 않음)                      |
| `LOW_BATTERY`  | WARN     | 배터리 20% 미만                                                        |
| `LINK_LOSS`    | WARN     | 연결이 UP인 동안 최근 30초 유실률 5% 이상. `targetType`은 `CONNECTION` |

조건이 풀리면 알람이 닫힙니다. `POST /alarms/{id}/ack` → `{ id, ackedAt, rev }`. 이미 풀린 알람이면 404입니다. 확인한 사용자는 `logs`의 `ALARM_ACKED` 행에 남습니다.

### 로그

`GET /logs?type&targetType&targetId&from&to&page&size` → `{ items, page, size, total }`

- `type`: `LINK_UP`, `LINK_DOWN`, `ALARM_RAISED`, `ALARM_CLEARED`, `ALARM_ACKED`
- `targetType`: `CONNECTION`, `DEVICE`, `PLC_POINT`
- 항목: `{ id, type, level, alarmCode, targetType, targetId, message, rolesUsersId, createdAt }`

### 측정

`GET /metrics` → `{ since, ingest: Item[], process }`

- `ingest` 항목(연결별): `key`(예: `VENDOR_A MQTT`), `received`, `accepted`, `duplicates`, `outOfOrder`, `missed`, `lossPct`, `latencyP50Ms`, `latencyP95Ms`, `latencySamples`
- `process`: `samples`, `cpuAvgPct`, `cpuMaxPct`, `rssLatestMb`, `rssMaxMb`, `heapUsedLatestMb`
- `POST /metrics/reset` → `{ since }`

## 3. WebSocket `ws://localhost:3000/ws`

메시지는 모두 `{ "event": 이름, "data": 내용 }` JSON입니다.

| 이벤트     | 방향        | data                                                                  | 언제                                         |
| ---------- | ----------- | --------------------------------------------------------------------- | -------------------------------------------- |
| `hello`    | 화면 → 서버 | `token`, `epoch?`, `lastRev?`                                         | 접속 직후 한 번. 처음이면 epoch·lastRev 없음 |
| `snapshot` | 서버 → 화면 | `epoch`, `rev`, `robots`, `plcPoints`, `links`, `alarms`              | 처음 접속, epoch가 다를 때                   |
| `delta`    | 서버 → 화면 | `fromRev`, `rev`, `robots`, `plcPoints`, `links`, `alarms`, `removed` | 100ms마다, 바뀐 것이 있을 때만               |
| `resync`   | 화면 → 서버 | `lastRev`                                                             | 받은 `fromRev`가 내 rev와 다를 때            |
| `ping`     | 양방향      | `t` (보낸 시각 ms)                                                    | 서버는 5초마다 보냄                          |
| `pong`     | 양방향      | `t` (받은 ping의 t)                                                   | ping을 받으면                                |
| `error`    | 서버 → 화면 | `message`                                                             | 토큰 오류, 형식 오류, hello 전에 resync      |

- 엔티티 모양은 REST와 같습니다(로봇, PLC 점, 알람). 연결은 `{ connectionId, status, changedAt, rev }`이고 `status`는 `UNKNOWN`, `UP`, `DOWN`입니다.
- `removed`는 `{ kind, id }[]`입니다. 지워진 연결·장비와 풀린 알람(`kind: "ALARM"`)이 실립니다.

### 순서와 복구 규칙

1. 화면은 `delta.fromRev`가 자기 rev와 **같을 때만** 반영하고 자기 rev를 `delta.rev`로 바꿉니다.
2. `fromRev`가 자기 rev보다 작으면 이미 반영한 것이라 버립니다. 크면 중간을 놓친 것이라 `resync`를 보냅니다.
3. 접속이 끊기면 `hello`에 마지막 `epoch`와 `rev`를 실어 다시 보냅니다. 같은 epoch면 그 뒤 바뀐 것만 `delta`로, 서버가 재시작해 epoch가 다르면 `snapshot`으로 받습니다.
4. 서버는 pong이 2번 연속 없으면 접속을 끊습니다. 화면도 같은 방식으로 끊김을 판정합니다.
5. 끊긴 동안의 중간 변화는 다시 보내지 않습니다. 그 사이의 기록은 `GET /logs`로 봅니다.

## 4. 에뮬레이터 장애 주입 `http://localhost:8090`

| 메서드 | 경로                      | 하는 일                                             |
| ------ | ------------------------- | --------------------------------------------------- |
| GET    | `/faults`                 | 그룹(A, B, C, PLC)별 장애 설정                      |
| PUT    | `/faults/{group}`         | 그룹 하나의 장애 설정 바꾸기                        |
| GET    | `/faults/devices`         | 켠 PLC 점과 오류를 넣은 로봇                        |
| PUT    | `/faults/plc-points/{no}` | PLC 점(0~15) 켜기·끄기 `{ "on": true }`             |
| PUT    | `/faults/robots/{serial}` | 로봇(`A-001` 꼴) 오류 넣기·빼기 `{ "error": true }` |

```http
PUT /faults/A
{ "disconnected": false, "delayMs": 0, "duplicatePct": 30, "reorderPct": 30, "lossPct": 0 }
```

- 응답은 공통 구조가 아니라 설정 그대로입니다. 없는 그룹은 404, 형식이 틀리면 400(`{ message }`)입니다.
- 장비 값 주입 응답은 `{ plcPointsOn: number[], robotErrors: string[] }`입니다. 오류를 넣은 로봇은 그 자리에 멈추고 제조사 형식대로 오류(A `fault`, B `ERR`, C 상태 4)와 코드 101을 보냅니다. 에뮬레이터는 장애를 넣지 않으면 PLC 값과 로봇 오류를 스스로 바꾸지 않습니다.
- 미들웨어는 이 설정을 모르고 받은 데이터만으로 판단합니다. 장애별 동작은 [README](../README.md#장애-확인)에 있습니다.
