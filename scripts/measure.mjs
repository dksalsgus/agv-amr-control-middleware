// 측정 스크립트: docker compose up 상태에서 `node scripts/measure.mjs` (Node 22, 의존성 없음)
// 결과는 Markdown 표로 표준 출력에 나온다. 설계 문서 6장 "측정 방법"을 따른다.

const API = process.env.API_URL ?? "http://localhost:3000";
const WS_URL = process.env.WS_URL ?? "ws://localhost:3000/ws";
const FAULT_API = process.env.FAULT_URL ?? "http://localhost:8090";
const NORMAL_SEC = Number(process.env.NORMAL_SEC ?? 30);
const FAULT_SEC = Number(process.env.FAULT_SEC ?? 15);
const PLC_LABEL = "PLC MODBUS_TCP";

const NORMAL_FAULT = {
  disconnected: false,
  delayMs: 0,
  duplicatePct: 0,
  reorderPct: 0,
  lossPct: 0,
};

const DISCONNECTED_FAULT = {
  disconnected: true,
  delayMs: 0,
  duplicatePct: 0,
  reorderPct: 0,
  lossPct: 0,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const percentile = (values, pct) => {
  if (values.length === 0) {
    return null;
  }
  const sorted = values.slice().sort((a, b) => a - b);
  const rank = Math.ceil((pct / 100) * sorted.length);
  return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1];
};

class Api {
  constructor() {
    this.token = null;
  }

  async login() {
    const body = await this.request("POST", "/auth/login", {
      username: "operator",
      password: "operator1234",
    });
    this.token = body.accessToken;
  }

  async request(method, path, body) {
    const response = await fetch(`${API}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        authorization: this.token ? `Bearer ${this.token}` : "",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = await response.json();
    if (!json.success) {
      throw new Error(`${method} ${path}: ${JSON.stringify(json.error)}`);
    }
    return json.data;
  }

  async setFault(group, fault) {
    const response = await fetch(`${FAULT_API}/faults/${group}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(fault),
    });
    if (!response.ok) {
      throw new Error(`PUT /faults/${group}: ${response.status}`);
    }
  }

  async clearFaults() {
    for (const group of ["A", "B", "C", "PLC"]) {
      await this.setFault(group, NORMAL_FAULT);
    }
  }
}

/** 화면처럼 WebSocket으로 받으면서 종단 지연과 seq 역행을 잰다. */
class Screen {
  constructor(token, labels) {
    this.token = token;
    this.labels = labels;
    this.epoch = null;
    this.rev = null;
    this.socket = null;
    this.latencies = new Map();
    this.lastSeqs = new Map();
    this.lastPlcChangedAt = new Map();
    this.links = new Map();
    this.freshAfter = new Map();
    this.seqRegressions = 0;
    this.listeners = [];
  }

  async connect(resume) {
    const startedAt = performance.now();
    const socket = new WebSocket(WS_URL);
    this.socket = socket;

    const replied = new Promise((resolve) => {
      this.listeners.push((event) => {
        if (event === "snapshot" || event === "delta") {
          resolve(performance.now() - startedAt);
          return true;
        }
        return false;
      });
    });

    socket.addEventListener("message", (message) =>
      this.onMessage(JSON.parse(message.data)),
    );
    await new Promise((resolve) => socket.addEventListener("open", resolve));
    socket.send(
      JSON.stringify({
        event: "hello",
        data: resume
          ? { token: this.token, epoch: this.epoch, lastRev: this.rev }
          : { token: this.token },
      }),
    );
    return await replied;
  }

  close() {
    this.socket?.close();
  }

  onMessage(message) {
    const receivedAt = Date.now();
    if (message.event === "ping") {
      this.socket.send(JSON.stringify({ event: "pong", data: message.data }));
      return;
    }
    if (message.event !== "snapshot" && message.event !== "delta") {
      return;
    }

    const isDelta = message.event === "delta";
    if (!isDelta) {
      this.epoch = message.data.epoch;
    }
    this.rev = message.data.rev;
    this.collectRobots(message.data.robots, receivedAt, isDelta);
    this.collectPlcPoints(message.data.plcPoints, receivedAt, isDelta);
    for (const link of message.data.links) {
      this.links.set(link.connectionId, link.status);
    }
    this.listeners = this.listeners.filter(
      (listener) => !listener(message.event),
    );
  }

  /** seq가 바뀐 로봇만 센다. stale 표시만 바뀐 것은 새 데이터가 아니다. */
  collectRobots(robots, receivedAt, isDelta) {
    for (const robot of robots) {
      if (!robot.state) {
        continue;
      }
      const lastSeq = this.lastSeqs.get(robot.id);
      const seq = robot.state.seq;
      this.lastSeqs.set(robot.id, seq);
      if (!isDelta || lastSeq === seq) {
        continue;
      }
      if (lastSeq !== undefined && seq < lastSeq) {
        this.seqRegressions += 1;
      }

      const sourceTs = Date.parse(robot.state.sourceTs);
      this.addLatency(
        this.labels.get(robot.connectionId),
        receivedAt - sourceTs,
      );
      this.markFresh(robot.connectionId, sourceTs);
    }
  }

  collectPlcPoints(points, receivedAt, isDelta) {
    for (const point of points) {
      const last = this.lastPlcChangedAt.get(point.id);
      this.lastPlcChangedAt.set(point.id, point.changedAt);
      if (!isDelta || !point.changedAt || last === point.changedAt) {
        continue;
      }
      this.addLatency(PLC_LABEL, receivedAt - Date.parse(point.changedAt));
    }
  }

  addLatency(label, ms) {
    const values = this.latencies.get(label) ?? [];
    values.push(ms);
    this.latencies.set(label, values);
  }

  markFresh(connectionId, sourceTs) {
    const waiting = this.freshAfter.get(connectionId);
    if (waiting && sourceTs > waiting.since) {
      this.freshAfter.delete(connectionId);
      waiting.resolve(performance.now());
    }
  }

  resetLatencies() {
    this.latencies.clear();
  }

  async waitLink(connectionId, status, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (this.links.get(connectionId) !== status) {
      if (Date.now() > deadline) {
        throw new Error(`${connectionId} ${status} 대기 시간 초과`);
      }
      await sleep(50);
    }
  }

  /** since 이후에 발생한 데이터가 화면에 처음 닿는 순간 */
  waitFresh(connectionId, since) {
    return new Promise((resolve) => {
      this.freshAfter.set(connectionId, { since, resolve });
    });
  }
}

class MeasureRunner {
  constructor() {
    this.api = new Api();
    this.lines = [];
  }

  async run() {
    await this.api.login();
    await this.api.clearFaults();
    const { connections } = await this.api.request("GET", "/connections");
    const labels = new Map(
      connections.map((item) => [
        item.id,
        `${item.vendorCode} ${item.protocol}`,
      ]),
    );
    const screen = new Screen(this.api.token, labels);
    await screen.connect(false);

    this.print(`# 측정 결과 (${new Date().toISOString()})`);
    await this.measureNormal(screen);
    await this.measureFaultFiltering(screen);
    await this.measureLinkRecovery(screen, connections);
    await this.measureScreenRecovery(screen);
    screen.close();
    await this.api.clearFaults();
    console.log(this.lines.join("\n"));
  }

  async measureNormal(screen) {
    await this.api.request("POST", "/metrics/reset");
    screen.resetLatencies();
    await sleep(NORMAL_SEC * 1000);
    const metrics = await this.api.request("GET", "/metrics");

    this.print(`\n## 1. 정상 ${NORMAL_SEC}초: 지연과 유실`);
    this.print("");
    this.print(
      "종단 지연은 화면(이 스크립트)이 delta를 받은 시각에서 장비의 발생 시각을 뺀 값입니다.",
    );
    this.print("");
    this.print(
      "| 연결 | 받음 | 유실률 | 중복 | 뒤바뀜 | 수집 지연 p50 / p95 | 종단 지연 p50 / p95 |",
    );
    this.print("| --- | --- | --- | --- | --- | --- | --- |");
    for (const item of metrics.ingest) {
      const e2e = screen.latencies.get(item.key) ?? [];
      this.print(
        `| ${item.key} | ${item.received} | ${item.lossPct}% | ${item.duplicates} | ${item.outOfOrder} | ${item.latencyP50Ms} / ${item.latencyP95Ms} ms | ${percentile(e2e, 50)} / ${percentile(e2e, 95)} ms |`,
      );
    }

    const process = metrics.process;
    this.print("");
    this.print(`| 프로세스 | 값 |`);
    this.print(`| --- | --- |`);
    this.print(
      `| CPU 평균 / 최대 (코어 1개 = 100%) | ${process.cpuAvgPct}% / ${process.cpuMaxPct}% |`,
    );
    this.print(
      `| RSS 최신 / 최대 | ${process.rssLatestMb} / ${process.rssMaxMb} MB |`,
    );
    this.print(`| heap 사용 | ${process.heapUsedLatestMb} MB |`);
    this.print(`| 표본 수 (5초 간격) | ${process.samples} |`);
  }

  async measureFaultFiltering(screen) {
    await this.api.request("POST", "/metrics/reset");
    const regressionsBefore = screen.seqRegressions;
    await this.api.setFault("A", {
      disconnected: false,
      delayMs: 0,
      duplicatePct: 30,
      reorderPct: 30,
      lossPct: 10,
    });
    await sleep(FAULT_SEC * 1000);
    await this.api.setFault("A", NORMAL_FAULT);
    const metrics = await this.api.request("GET", "/metrics");
    const vendorA = metrics.ingest.find((item) => item.key === "VENDOR_A MQTT");

    this.print(
      `\n## 2. 제조사 A에 중복 30%·뒤바뀜 30%·유실 10% 주입 ${FAULT_SEC}초`,
    );
    this.print("");
    this.print("| 항목 | 값 |");
    this.print("| --- | --- |");
    this.print(`| 받은 메시지 | ${vendorA.received} |`);
    this.print(`| 받아들임 | ${vendorA.accepted} |`);
    this.print(`| 중복으로 버림 | ${vendorA.duplicates} |`);
    this.print(`| 늦게 와서 버림 | ${vendorA.outOfOrder} |`);
    this.print(
      `| 건너뛴 seq (유실률) | ${vendorA.missed} (${vendorA.lossPct}%) |`,
    );
    this.print(
      `| 화면에서 seq가 뒤로 간 횟수 | ${screen.seqRegressions - regressionsBefore} |`,
    );
    this.print("");
    this.print(
      "늦게 온 메시지는 이미 다음 seq를 받은 뒤라 버려지고, 그 seq는 건너뛴 것으로 셉니다. 그래서 유실률은 주입한 유실에 뒤바뀜이 더해진 값입니다.",
    );
  }

  async measureLinkRecovery(screen, connections) {
    this.print("\n## 3. 현장 연결 끊김 복구");
    this.print("");
    this.print(
      "끊김을 풀고 나서 연결이 UP이 되기까지, 그리고 그 뒤에 발생한 새 데이터가 화면에 처음 닿기까지의 시간입니다.",
    );
    this.print("");
    this.print("| 그룹 | DOWN 감지 | UP까지 | 첫 새 데이터까지 |");
    this.print("| --- | --- | --- | --- |");

    for (const [group, vendorCode] of [
      ["B", "VENDOR_B"],
      ["C", "VENDOR_C"],
    ]) {
      const connection = connections.find(
        (item) => item.vendorCode === vendorCode,
      );
      const downAt = performance.now();
      await this.api.setFault(group, DISCONNECTED_FAULT);
      await screen.waitLink(connection.id, "DOWN", 20_000);
      const downMs = performance.now() - downAt;
      await sleep(2000);

      const clearedAt = performance.now();
      const fresh = screen.waitFresh(connection.id, Date.now());
      await this.api.setFault(group, NORMAL_FAULT);
      await screen.waitLink(connection.id, "UP", 20_000);
      const upMs = performance.now() - clearedAt;
      const freshMs = (await fresh) - clearedAt;
      this.print(
        `| ${group} (${connection.protocol}) | ${Math.round(downMs)} ms | ${Math.round(upMs)} ms | ${Math.round(freshMs)} ms |`,
      );
      await sleep(2000);
    }
  }

  async measureScreenRecovery(screen) {
    this.print("\n## 4. 화면 재접속 복구");
    this.print("");
    this.print("| 방식 | 소켓을 연 뒤 첫 응답까지 |");
    this.print("| --- | --- |");

    screen.close();
    await sleep(1000);
    const resumeMs = await screen.connect(true);
    this.print(
      `| 이어받기 (epoch + lastRev → delta) | ${Math.round(resumeMs)} ms |`,
    );

    screen.close();
    await sleep(1000);
    const snapshotMs = await screen.connect(false);
    this.print(`| 처음 접속 (snapshot 전체) | ${Math.round(snapshotMs)} ms |`);
  }

  print(line) {
    this.lines.push(line);
  }
}

await new MeasureRunner().run();
