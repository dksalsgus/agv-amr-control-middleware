import { Icon } from "../components/icon";

export const FieldError = ({
  id,
  message,
}: {
  id: string;
  message: string;
}) => (
  <span className="field-error" id={id} hidden={!message}>
    {message && (
      <>
        <Icon name="critical" />
        <span>{message}</span>
      </>
    )}
  </span>
);
