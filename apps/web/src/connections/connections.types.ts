/** GET /connections 항목 */
export type ConnectionItem = {
  id: string;
  name: string;
  vendorCode: string;
  vendorName: string;
  protocol: string;
  enabled: boolean;
  version: number;
  deviceCount: number;
  linkStatus: string;
  linkChangedAt: string | null;
};

export type Protocol = "MQTT" | "REST" | "MODBUS_TCP";

/** GET /connections/:id. config에 비밀번호는 없고 hasPassword로만 알려 준다. */
export type ConnectionDetail = ConnectionItem & {
  config: Record<string, unknown>;
  hasPassword: boolean;
};

/** GET /vendors 항목 */
export type VendorItem = { id: string; code: string; name: string };

export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "password" | "int" | "seg";
  required?: boolean;
  optional?: boolean;
  span?: 2;
  mono?: boolean;
  placeholder?: string;
  hint?: string;
  min?: number;
  max?: number;
  unit?: string;
  options?: [string, string][];
};

/** 편집 중인 값. 입력란 그대로 문자열로 들고, 저장할 때 숫자로 바꾼다. */
export type ConnectionDraft = {
  vendorId: string;
  name: string;
  protocol: Protocol;
  config: Record<string, string>;
};

/** 키는 "name"처럼 기본 정보이거나 "cfg.port"처럼 접속 정보다. */
export type FieldErrors = Record<string, string>;

export type ConnectionWriteBody = {
  name: string;
  mqtt?: Record<string, unknown>;
  rest?: Record<string, unknown>;
  modbus?: Record<string, unknown>;
};
