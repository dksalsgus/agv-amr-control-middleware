/** 에뮬레이터의 장애 그룹. 제조사 A·B·C와 PLC */
export type FaultGroup = "A" | "B" | "C" | "PLC";

export type FaultNumberKey =
  | "delayMs"
  | "duplicatePct"
  | "reorderPct"
  | "lossPct";

/** GET /faults, PUT /faults/{group}의 값. 비율은 0~100(%) */
export type FaultConfig = {
  disconnected: boolean;
  delayMs: number;
  duplicatePct: number;
  reorderPct: number;
  lossPct: number;
};

/** 입력 중인 값. 숫자 칸은 입력한 글자 그대로 둔다. */
export type FaultDraft = {
  disconnected: boolean;
  delayMs: string;
  duplicatePct: string;
  reorderPct: string;
  lossPct: string;
};

export type FaultErrors = Partial<Record<FaultNumberKey, string>>;

export type GroupPhase = "idle" | "applying" | "applied" | "failed";

export type GroupState = {
  applied: FaultConfig;
  draft: FaultDraft;
  phase: GroupPhase;
  appliedAt: number | null;
  errors: FaultErrors;
  failReason: string;
};

export type GroupDef = {
  id: FaultGroup;
  name: string;
  protocol: string;
  unit: string;
};

export type FieldDef = {
  key: FaultNumberKey;
  label: string;
  short: string;
  unit: string;
  min: number;
  max: number;
  range: boolean;
  quick: number[];
  hint: string;
};

/** 에뮬레이터 장비 값 주입 상태: 켠 PLC 점 번호, 오류를 넣은 로봇 serial */
export type DeviceFaults = {
  plcPointsOn: number[];
  robotErrors: string[];
};

/** 장비 값 주입 빠른 설정. PLC 점을 켜거나 로봇에 오류를 넣는다. */
export type DevicePreset =
  | { label: string; tag: string; kind: "plc"; pointNo: number }
  | { label: string; tag: string; kind: "robot"; serial: string };

export type Preset = {
  label: string;
  group: FaultGroup;
  patch: Partial<FaultConfig>;
};

export type LoadStatus = "loading" | "ready" | "error";

/** 실패한 요청. 다시 시도하면 같은 요청을 보낸다. */
export type RequestFailure = {
  method: "GET" | "PUT";
  path: string;
  reason: string;
  retry: () => void;
};
