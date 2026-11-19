import { Icon } from "../components/icon";
import { LOG_LABEL, SEV_ICON } from "./logs.constants";
import { LogType } from "./logs.types";

export const TypeTag = ({ type }: { type: LogType }) => (
  <span className="type-tag" data-type={type}>
    <span className="dot" />
    {LOG_LABEL[type]}
  </span>
);

export const SevTag = ({ level }: { level: string }) => (
  <span className="sev" data-sev={level}>
    <Icon name={SEV_ICON[level] ?? "info"} />
    {level}
  </span>
);
