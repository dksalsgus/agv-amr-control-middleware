import { Toast } from "./use-toasts";

type Props = { toasts: Toast[] };

export const ToastList = ({ toasts }: Props) => (
  <div className="toasts" aria-live="polite">
    {toasts.map((toast) => (
      <div key={toast.id} className="toast" data-tone={toast.tone}>
        {toast.text}
      </div>
    ))}
  </div>
);
