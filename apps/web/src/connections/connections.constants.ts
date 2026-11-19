import { FieldDef, Protocol } from "./connections.types";

export const NAME_MAX = 40;

export const PROTOCOLS: Protocol[] = ["MQTT", "REST", "MODBUS_TCP"];

/** 서버 요청 본문에서 접속 정보를 담는 키 */
export const CONFIG_BODY_KEY: Record<Protocol, "mqtt" | "rest" | "modbus"> = {
  MQTT: "mqtt",
  REST: "rest",
  MODBUS_TCP: "modbus",
};

export const SECTION_DESC: Record<Protocol, string> = {
  MQTT: "브로커에 구독해 로봇 상태를 받습니다.",
  REST: "정해진 주기로 제조사 서버에 요청해 로봇 상태를 가져옵니다.",
  MODBUS_TCP: "정해진 주기로 레지스터 블록을 읽습니다.",
};

/** 프로토콜별 접속 정보 입력란. 범위는 서버 검증(설정 DTO)과 같다. */
export const FIELDS: Record<Protocol, FieldDef[]> = {
  MQTT: [
    {
      key: "url",
      label: "브로커 주소",
      type: "text",
      required: true,
      span: 2,
      mono: true,
      placeholder: "mqtts://broker.plant1.local:8883",
      hint: "mqtt:// 또는 mqtts://로 시작합니다.",
    },
    {
      key: "topicPattern",
      label: "토픽 패턴",
      type: "text",
      required: true,
      span: 2,
      mono: true,
      placeholder: "fleet/vendor-a/+/state",
      hint: "+는 한 단계, #은 여러 단계를 뜻합니다. #은 마지막 단계에만 씁니다.",
    },
    {
      key: "qos",
      label: "QoS",
      type: "seg",
      span: 2,
      options: [
        ["0", "0 · 최대 한 번"],
        ["1", "1 · 최소 한 번"],
        ["2", "2 · 정확히 한 번"],
      ],
    },
    {
      key: "username",
      label: "사용자 이름",
      type: "text",
      optional: true,
      mono: true,
    },
    { key: "password", label: "비밀번호", type: "password", optional: true },
  ],
  REST: [
    {
      key: "baseUrl",
      label: "기본 주소",
      type: "text",
      required: true,
      span: 2,
      mono: true,
      placeholder: "https://fms.plant1.local/api/v2",
      hint: "http:// 또는 https://로 시작합니다.",
    },
    {
      key: "mode",
      label: "조회 방식",
      type: "seg",
      span: 2,
      options: [
        ["bulk", "전체 한 번에 (bulk)"],
        ["each", "차량별 (each)"],
      ],
      hint: "bulk는 요청 한 번에 모든 차량을, each는 차량마다 따로 요청합니다.",
    },
    {
      key: "pollIntervalMs",
      label: "폴링 주기",
      type: "int",
      required: true,
      min: 200,
      max: 60000,
      unit: "ms",
    },
    {
      key: "timeoutMs",
      label: "응답 대기 시간",
      type: "int",
      required: true,
      min: 100,
      max: 30000,
      unit: "ms",
    },
  ],
  MODBUS_TCP: [
    {
      key: "host",
      label: "호스트",
      type: "text",
      required: true,
      mono: true,
      placeholder: "10.20.3.41",
      hint: "IP 주소 또는 호스트 이름",
    },
    {
      key: "port",
      label: "포트",
      type: "int",
      required: true,
      min: 1,
      max: 65535,
    },
    {
      key: "unitId",
      label: "유닛 ID",
      type: "int",
      required: true,
      min: 0,
      max: 255,
    },
    {
      key: "pollIntervalMs",
      label: "폴링 주기",
      type: "int",
      required: true,
      min: 100,
      max: 60000,
      unit: "ms",
    },
    {
      key: "baseAddress",
      label: "시작 주소",
      type: "int",
      required: true,
      min: 0,
      max: 65535,
    },
    {
      key: "blockSize",
      label: "블록 크기",
      type: "int",
      required: true,
      min: 1,
      max: 125,
      unit: "개",
      hint: "한 번에 읽을 레지스터 수",
    },
  ],
};

export const DEFAULTS: Record<Protocol, Record<string, string>> = {
  MQTT: { url: "", topicPattern: "", qos: "1", username: "", password: "" },
  REST: {
    baseUrl: "",
    mode: "bulk",
    pollIntervalMs: "1000",
    timeoutMs: "3000",
  },
  MODBUS_TCP: {
    host: "",
    port: "502",
    unitId: "1",
    pollIntervalMs: "500",
    baseAddress: "0",
    blockSize: "64",
  },
};
