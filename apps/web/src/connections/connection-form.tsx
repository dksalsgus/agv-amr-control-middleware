import { CSSProperties } from "react";
import { formatNumber } from "../common/utils/number.util";
import { Icon } from "../components/icon";
import { configKey, getValue } from "./connection-draft.util";
import {
  FIELDS,
  NAME_MAX,
  PROTOCOLS,
  SECTION_DESC,
} from "./connections.constants";
import {
  ConnectionDraft,
  FieldDef,
  FieldErrors,
  VendorItem,
} from "./connections.types";

type Props = {
  draft: ConnectionDraft;
  creating: boolean;
  vendors: VendorItem[];
  /** 수정 중인 연결의 제조사 이름. 만든 뒤에는 바꿀 수 없다. */
  vendorName: string;
  hasSavedPassword: boolean;
  errors: FieldErrors;
  disabled: boolean;
  onChange: (key: string, value: string) => void;
  onBlur: (key: string) => void;
};

const fid = (key: string) => `f-${key.replace(".", "-")}`;
const eid = (key: string) => `e-${key.replace(".", "-")}`;

const FieldError = ({ id, message }: { id: string; message?: string }) => (
  <span className="field-error" id={id} hidden={!message}>
    {message && (
      <>
        <Icon name="critical" />
        <span>{message}</span>
      </>
    )}
  </span>
);

const LabelTail = ({ fieldKey, def }: { fieldKey: string; def: FieldDef }) => (
  <>
    <span className="field-key">{fieldKey.replace("cfg.", "")}</span>
    {def.required && (
      <>
        <span className="req" aria-hidden="true">
          *
        </span>
        <span className="sr-only">필수</span>
      </>
    )}
    {def.optional && <span className="opt">선택</span>}
  </>
);

const hintOf = (def: FieldDef, passwordHint: string): string => {
  if (def.type === "password") {
    return passwordHint;
  }
  if (def.type === "int") {
    const range = `허용 범위 ${formatNumber(def.min ?? 0)}~${formatNumber(def.max ?? 0)}`;
    return def.hint ? `${range} · ${def.hint}` : range;
  }
  return def.hint ?? "";
};

type FieldProps = {
  fieldKey: string;
  def: FieldDef;
  value: string;
  error?: string;
  hint: string;
  onChange: (key: string, value: string) => void;
  onBlur: (key: string) => void;
};

const SegField = ({ field: props }: { field: FieldProps }) => {
  const id = fid(props.fieldKey);
  const hintId = `${id}-hint`;
  const described = `${props.hint ? hintId : ""} ${eid(props.fieldKey)}`.trim();
  return (
    <div className={props.def.span === 2 ? "field span-2" : "field"}>
      <span className="field-label" id={`${id}-label`}>
        {props.def.label}
        <LabelTail fieldKey={props.fieldKey} def={props.def} />
      </span>
      <div
        className="seg"
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-describedby={described}
      >
        {(props.def.options ?? []).map(([value, label]) => (
          <label key={value}>
            <input
              type="radio"
              name={id}
              value={value}
              checked={props.value === value}
              onChange={() => props.onChange(props.fieldKey, value)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
      {props.hint && (
        <span className="field-hint" id={hintId}>
          {props.hint}
        </span>
      )}
      <FieldError id={eid(props.fieldKey)} message={props.error} />
    </div>
  );
};

const InputField = ({ field: props }: { field: FieldProps }) => {
  const id = fid(props.fieldKey);
  const hintId = `${id}-hint`;
  const described = `${props.hint ? hintId : ""} ${eid(props.fieldKey)}`.trim();
  const mono = props.def.mono || props.def.type === "int";
  const input = (
    <input
      className={mono ? "input-lg mono" : "input-lg"}
      id={id}
      type={props.def.type === "password" ? "password" : "text"}
      value={props.value}
      inputMode={props.def.type === "int" ? "numeric" : undefined}
      placeholder={props.def.placeholder}
      aria-required={props.def.required ? true : undefined}
      autoComplete={props.def.type === "password" ? "new-password" : "off"}
      aria-describedby={described}
      aria-invalid={Boolean(props.error)}
      onChange={(event) => props.onChange(props.fieldKey, event.target.value)}
      onBlur={() => props.onBlur(props.fieldKey)}
    />
  );
  return (
    <div className={props.def.span === 2 ? "field span-2" : "field"}>
      <label className="field-label" htmlFor={id}>
        {props.def.label}
        <LabelTail fieldKey={props.fieldKey} def={props.def} />
      </label>
      {props.def.unit ? (
        <div className="input-group">
          {input}
          <span className="addon" aria-hidden="true">
            {props.def.unit}
          </span>
        </div>
      ) : (
        input
      )}
      {props.hint && (
        <span className="field-hint" id={hintId}>
          {props.hint}
        </span>
      )}
      <FieldError id={eid(props.fieldKey)} message={props.error} />
    </div>
  );
};

type SelectProps = {
  fieldKey: string;
  label: string;
  value: string;
  options: [string, string][];
  hint?: string;
  disabled: boolean;
  error?: string;
  onChange: (key: string, value: string) => void;
};

const SelectField = (props: SelectProps) => {
  const id = fid(props.fieldKey);
  const hintId = `${id}-hint`;
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {props.label}
        <span className="field-key">{props.fieldKey}</span>
        <span className="req" aria-hidden="true">
          *
        </span>
        <span className="sr-only">필수</span>
      </label>
      <select
        className="input-lg"
        id={id}
        value={props.value}
        disabled={props.disabled}
        aria-describedby={`${props.hint ? `${hintId} ` : ""}${eid(props.fieldKey)}`}
        onChange={(event) => props.onChange(props.fieldKey, event.target.value)}
      >
        {props.options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {props.hint && (
        <span className="field-hint" id={hintId}>
          {props.hint}
        </span>
      )}
      <FieldError id={eid(props.fieldKey)} message={props.error} />
    </div>
  );
};

/** 기본 정보와 프로토콜별 접속 정보 입력 */
export const ConnectionForm = (props: Props) => {
  const { draft } = props;
  const nameDef: FieldDef = {
    key: "name",
    label: "이름",
    type: "text",
    required: true,
    placeholder: "예: 제조사 A MQTT",
    hint: `${NAME_MAX}자 이하, 다른 연결과 겹치지 않게`,
  };
  const passwordHint = props.hasSavedPassword
    ? "저장된 비밀번호가 있습니다. 비워 두면 그대로 유지합니다."
    : "비워 두면 비밀번호 없이 접속합니다.";
  const vendorOptions: [string, string][] = props.creating
    ? props.vendors.map((vendor) => [vendor.id, vendor.name])
    : [["", props.vendorName]];
  const fixedHint = props.creating
    ? undefined
    : "만든 뒤에는 바꿀 수 없습니다.";

  return (
    <fieldset className="form-fs" disabled={props.disabled}>
      <section className="section" aria-labelledby="secBasic">
        <h3 className="section-title" id="secBasic">
          기본 정보
        </h3>
        <div className="fields">
          <SelectField
            fieldKey="vendorId"
            label="제조사"
            value={draft.vendorId}
            options={vendorOptions}
            hint={fixedHint}
            disabled={!props.creating}
            error={props.errors.vendorId}
            onChange={props.onChange}
          />
          <InputField
            field={{
              fieldKey: "name",
              def: nameDef,
              value: draft.name,
              error: props.errors.name,
              hint: nameDef.hint ?? "",
              onChange: props.onChange,
              onBlur: props.onBlur,
            }}
          />
          <SelectField
            fieldKey="protocol"
            label="프로토콜"
            value={draft.protocol}
            options={PROTOCOLS.map((protocol) => [protocol, protocol])}
            hint={
              props.creating
                ? "바꾸면 아래 접속 정보 항목이 바뀝니다."
                : fixedHint
            }
            disabled={!props.creating}
            onChange={props.onChange}
          />
        </div>
      </section>
      <section className="section" aria-labelledby="secConn">
        <div
          className="od-stack"
          style={{ "--od-gap": "2px" } as CSSProperties}
        >
          <h3 className="section-title" id="secConn">
            접속 정보 · {draft.protocol}
          </h3>
          <p className="section-desc">{SECTION_DESC[draft.protocol]}</p>
        </div>
        <div className="fields">
          {FIELDS[draft.protocol].map((def) => {
            const key = configKey(def.key);
            const fieldProps: FieldProps = {
              fieldKey: key,
              def,
              value: getValue(draft, key),
              error: props.errors[key],
              hint: hintOf(def, passwordHint),
              onChange: props.onChange,
              onBlur: props.onBlur,
            };
            return def.type === "seg" ? (
              <SegField key={key} field={fieldProps} />
            ) : (
              <InputField key={key} field={fieldProps} />
            );
          })}
        </div>
      </section>
    </fieldset>
  );
};
