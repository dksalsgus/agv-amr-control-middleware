import {
  DevicePreset,
  FaultConfig,
  FieldDef,
  GroupDef,
  Preset,
} from "./faults.types";

/** 화면은 같은 출처의 /emulator로 부르고, 개발 서버와 nginx가 에뮬레이터로 넘긴다. */
export const EMULATOR_BASE_PATH = "/emulator";
/** docker compose 안의 에뮬레이터 장애 주입 API 주소 */
export const EMULATOR_HOST = "emulator:8090";

/** 에뮬레이터가 지연용 스냅샷을 10초만 보관해서 그 이상은 받지 않는다. */
const DELAY_MAX_MS = 10000;

export const GROUPS: GroupDef[] = [
  { id: "A", name: "제조사 A", protocol: "MQTT", unit: "로봇 40대" },
  { id: "B", name: "제조사 B", protocol: "REST", unit: "로봇 30대" },
  { id: "C", name: "제조사 C", protocol: "Modbus TCP", unit: "로봇 20대" },
  { id: "PLC", name: "PLC", protocol: "Modbus TCP", unit: "PLC 16점" },
];

export const FIELDS: FieldDef[] = [
  {
    key: "delayMs",
    label: "지연",
    short: "지연",
    unit: "ms",
    min: 0,
    max: DELAY_MAX_MS,
    range: false,
    quick: [0, 2000, 5000],
    hint: "메시지를 늦게 보냅니다",
  },
  {
    key: "duplicatePct",
    label: "중복률",
    short: "중복",
    unit: "%",
    min: 0,
    max: 100,
    range: true,
    quick: [],
    hint: "같은 메시지를 한 번 더 보냅니다",
  },
  {
    key: "reorderPct",
    label: "순서 뒤바뀜률",
    short: "순서 뒤바뀜",
    unit: "%",
    min: 0,
    max: 100,
    range: true,
    quick: [],
    hint: "메시지 순서를 섞습니다",
  },
  {
    key: "lossPct",
    label: "유실률",
    short: "유실",
    unit: "%",
    min: 0,
    max: 100,
    range: true,
    quick: [],
    hint: "메시지를 버립니다",
  },
];

export const NORMAL: FaultConfig = {
  disconnected: false,
  delayMs: 0,
  duplicatePct: 0,
  reorderPct: 0,
  lossPct: 0,
};

export const PRESETS: Preset[] = [
  { label: "B 연결 끊김", group: "B", patch: { disconnected: true } },
  { label: "A 중복 30%", group: "A", patch: { duplicatePct: 30 } },
  { label: "C 지연 5초", group: "C", patch: { delayMs: 5000 } },
  { label: "PLC 유실 20%", group: "PLC", patch: { lossPct: 20 } },
  { label: "A 순서 뒤바뀜 25%", group: "A", patch: { reorderPct: 25 } },
];

/** 알람이 걸리는 PLC 점(도어 0~3, 비상정지 8·9)과 제조사별 로봇 하나 */
export const DEVICE_PRESETS: DevicePreset[] = [
  { label: "도어 1 열림", tag: "PLC 00", kind: "plc", pointNo: 0 },
  { label: "비상정지 1", tag: "PLC 08", kind: "plc", pointNo: 8 },
  { label: "AMR A-001 오류", tag: "A", kind: "robot", serial: "A-001" },
  { label: "AGV B-001 오류", tag: "B", kind: "robot", serial: "B-001" },
  { label: "AGV C-001 오류", tag: "C", kind: "robot", serial: "C-001" },
];
