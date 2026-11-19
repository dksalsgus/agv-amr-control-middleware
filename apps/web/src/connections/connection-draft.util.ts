import { formatNumber } from "../common/utils/number.util";
import {
  CONFIG_BODY_KEY,
  DEFAULTS,
  FIELDS,
  NAME_MAX,
} from "./connections.constants";
import {
  ConnectionDetail,
  ConnectionDraft,
  ConnectionWriteBody,
  FieldDef,
  FieldErrors,
  Protocol,
  VendorItem,
} from "./connections.types";

const CONFIG_PREFIX = "cfg.";

export const configKey = (key: string): string => `${CONFIG_PREFIX}${key}`;

const isConfigKey = (key: string): boolean => key.startsWith(CONFIG_PREFIX);

const stripPrefix = (key: string): string => key.slice(CONFIG_PREFIX.length);

export const fieldDef = (
  protocol: Protocol,
  key: string,
): FieldDef | undefined =>
  FIELDS[protocol].find((field) => field.key === stripPrefix(key));

/** 서버 config를 입력란 문자열로. 비밀번호는 서버가 주지 않으므로 늘 빈 값이다. */
const configToDraft = (
  protocol: Protocol,
  config: Record<string, unknown>,
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(DEFAULTS[protocol]).map(([key, fallback]) => {
      const value = config[key];
      const usable =
        key !== "password" && value !== undefined && value !== null;
      return [key, usable ? String(value) : fallback];
    }),
  );

export const draftFromDetail = (detail: ConnectionDetail): ConnectionDraft => ({
  vendorId: "",
  name: detail.name,
  protocol: detail.protocol as Protocol,
  config: configToDraft(detail.protocol as Protocol, detail.config),
});

export const emptyDraft = (vendorId: string): ConnectionDraft => ({
  vendorId,
  name: "",
  protocol: "MQTT",
  config: Object.assign({}, DEFAULTS.MQTT),
});

/** 그 제조사·프로토콜의 기본 접속 정보로 접속 정보를 새로 채운다. 이름과 프로토콜은 그대로 둔다. */
export const withVendorDefaults = (
  draft: ConnectionDraft,
  vendor: VendorItem | undefined,
): ConnectionDraft => {
  const defaults = vendor?.connectionDefaults[draft.protocol] ?? {};
  return Object.assign({}, draft, {
    config: configToDraft(draft.protocol, defaults),
  });
};

export const getValue = (draft: ConnectionDraft, key: string): string => {
  if (isConfigKey(key)) {
    return draft.config[stripPrefix(key)] ?? "";
  }
  return String(draft[key as keyof ConnectionDraft] ?? "");
};

/** 값 하나를 바꾼 새 초안. 프로토콜을 바꾸면 접속 정보는 그 프로토콜 기본값으로 시작한다. */
export const withValue = (
  draft: ConnectionDraft,
  key: string,
  value: string,
): ConnectionDraft => {
  if (isConfigKey(key)) {
    const config = Object.assign({}, draft.config, {
      [stripPrefix(key)]: value,
    });
    return Object.assign({}, draft, { config });
  }
  if (key === "protocol") {
    const protocol = value as Protocol;
    return Object.assign({}, draft, {
      protocol,
      config: Object.assign({}, DEFAULTS[protocol]),
    });
  }
  return Object.assign({}, draft, { [key]: value });
};

export const activeKeys = (draft: ConnectionDraft, creating: boolean) => {
  const base = creating ? ["vendorId", "name", "protocol"] : ["name"];
  return base.concat(
    FIELDS[draft.protocol].map((field) => configKey(field.key)),
  );
};

export const labelOf = (protocol: Protocol, key: string): string => {
  if (key === "vendorId") {
    return "제조사";
  }
  if (key === "name") {
    return "이름";
  }
  if (key === "protocol") {
    return "프로토콜";
  }
  return fieldDef(protocol, key)?.label ?? key;
};

const checkInt = (value: string, min: number, max: number): string => {
  const text = value.trim();
  const range = `${formatNumber(min)}~${formatNumber(max)}`;
  if (text === "") {
    return `값을 입력하세요. 허용 범위 ${range}`;
  }
  if (!/^\d+$/.test(text)) {
    return `숫자(정수)만 입력하세요. 허용 범위 ${range}`;
  }
  const n = Number(text);
  if (n < min || n > max) {
    return `${range} 사이로 입력하세요. 지금 값: ${formatNumber(n)}`;
  }
  return "";
};

const checkUrl = (
  value: string,
  schemes: string[],
  example: string,
): string => {
  const match = value
    .trim()
    .match(/^([a-z]+):\/\/([A-Za-z0-9.-]+)(?::(\d{1,5}))?(\/\S*)?$/);
  if (!match || !schemes.includes(match[1])) {
    const prefixes = schemes.map((scheme) => `${scheme}://`).join(" 또는 ");
    return `${prefixes}로 시작하는 주소여야 합니다. 예: ${example}`;
  }
  const port = match[3] ? Number(match[3]) : null;
  if (port !== null && (port < 1 || port > 65535)) {
    return "주소의 포트는 1~65535 사이여야 합니다.";
  }
  return "";
};

const checkTopic = (value: string): string => {
  const text = value.trim();
  if (!text) {
    return "구독할 토픽 패턴을 입력하세요. 예: fleet/vendor-a/+/state";
  }
  if (/\s/.test(text)) {
    return "공백은 쓸 수 없습니다. 단계는 /로 구분합니다.";
  }
  const segments = text.split("/");
  const badHash = segments.some(
    (segment, i) =>
      segment.includes("#") && (segment !== "#" || i !== segments.length - 1),
  );
  if (badHash) {
    return "#은 마지막 단계에만 단독으로 쓸 수 있습니다. 예: fleet/vendor-a/#";
  }
  if (segments.some((segment) => segment.includes("+") && segment !== "+")) {
    return "+는 한 단계 전체를 대신할 때만 씁니다. 예: fleet/+/state";
  }
  return "";
};

const checkHost = (value: string): string => {
  const text = value.trim();
  if (!text) {
    return "호스트를 입력하세요. 예: 10.20.3.41";
  }
  if (!/^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$/.test(text)) {
    return "영문, 숫자, 점(.), 하이픈(-)만 쓸 수 있습니다.";
  }
  return "";
};

const checkName = (value: string, takenNames: string[]): string => {
  const text = value.trim();
  if (!text) {
    return "연결 이름을 입력하세요. 예: 제조사 A MQTT";
  }
  if (text.length > NAME_MAX) {
    return `${NAME_MAX}자 이하로 입력하세요. 지금 ${text.length}자`;
  }
  if (takenNames.includes(text)) {
    return "이미 같은 이름의 연결이 있습니다. 다른 이름을 입력하세요.";
  }
  return "";
};

const VALIDATORS: Record<string, (value: string) => string> = {
  "cfg.url": (value) =>
    value.trim()
      ? checkUrl(value, ["mqtt", "mqtts"], "mqtts://broker.plant1.local:8883")
      : "브로커 주소를 입력하세요. 예: mqtts://broker.plant1.local:8883",
  "cfg.topicPattern": checkTopic,
  "cfg.baseUrl": (value) =>
    value.trim()
      ? checkUrl(value, ["http", "https"], "https://fms.plant1.local/api/v2")
      : "기본 주소를 입력하세요. 예: https://fms.plant1.local/api/v2",
  "cfg.host": checkHost,
};

/** takenNames는 다른 연결들의 이름이다. 같은 이름을 막는다. */
export const validateKey = (
  draft: ConnectionDraft,
  key: string,
  takenNames: string[],
): string => {
  const value = getValue(draft, key);
  if (key === "name") {
    return checkName(value, takenNames);
  }
  if (key === "vendorId") {
    return value ? "" : "제조사를 고르세요.";
  }
  const validator = VALIDATORS[key];
  if (validator) {
    return validator(value);
  }
  const field = isConfigKey(key) ? fieldDef(draft.protocol, key) : undefined;
  if (field?.type === "int") {
    return checkInt(value, field.min ?? 0, field.max ?? 0);
  }
  return "";
};

export const validateAll = (
  draft: ConnectionDraft,
  creating: boolean,
  takenNames: string[],
): FieldErrors =>
  Object.fromEntries(
    activeKeys(draft, creating)
      .map((key) => [key, validateKey(draft, key, takenNames)])
      .filter(([, message]) => message !== ""),
  );

/** 저장된 값과 다른 입력란. 비밀번호는 입력했으면 바뀐 것으로 본다. */
export const changedKeys = (
  draft: ConnectionDraft,
  saved: ConnectionDraft,
): string[] => {
  const nameChanged = draft.name !== saved.name ? ["name"] : [];
  const protocolChanged = draft.protocol !== saved.protocol ? ["protocol"] : [];
  const configChanged = FIELDS[draft.protocol]
    .filter((field) =>
      field.key === "password"
        ? draft.config.password !== ""
        : draft.config[field.key] !== saved.config[field.key],
    )
    .map((field) => configKey(field.key));
  return nameChanged.concat(protocolChanged, configChanged);
};

/** 입력란 문자열을 서버 요청 모양으로. 비밀번호를 비워 두면 보내지 않아 저장된 값을 유지한다. */
export const toWriteBody = (draft: ConnectionDraft): ConnectionWriteBody => {
  const config = Object.fromEntries(
    FIELDS[draft.protocol]
      .filter(
        (field) => !field.optional || draft.config[field.key].trim() !== "",
      )
      .map((field) => {
        const raw = draft.config[field.key];
        const numeric = field.type === "int" || field.key === "qos";
        return [field.key, numeric ? Number(raw) : raw.trim()];
      }),
  );
  return {
    name: draft.name.trim(),
    protocol: draft.protocol,
    [CONFIG_BODY_KEY[draft.protocol]]: config,
  };
};
