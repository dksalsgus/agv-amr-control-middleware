import { ReactNode, useEffect, useRef } from "react";
import { Icon } from "./icon";

export type ConfirmRequest = {
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "info";
  /** 없으면 닫기 버튼만 보인다. */
  onConfirm?: () => void;
};

type Props = { request: ConfirmRequest | null; onClose: () => void };

/** 되돌릴 수 없는 동작 앞에서 한 번 더 묻는 대화상자 */
export const ConfirmDialog = ({ request, onClose }: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (request && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    }
    if (!request && dialog.open) {
      dialog.close();
    }
  }, [request]);

  const tone = request?.tone ?? "danger";
  const confirm = () => {
    const action = request?.onConfirm;
    onClose();
    action?.();
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby="dlgTitle"
      aria-describedby="dlgText"
      onClose={onClose}
    >
      <div className="modal-body">
        <h2 className="modal-title" id="dlgTitle">
          <Icon name={tone === "danger" ? "warn" : "info"} size={18} />
          {request?.title}
        </h2>
        <div className="modal-text" id="dlgText">
          {request?.body}
        </div>
      </div>
      <div className="modal-foot">
        <button type="button" className="btn" ref={cancelRef} onClick={onClose}>
          {request?.onConfirm ? "취소" : "닫기"}
        </button>
        {request?.onConfirm && (
          <button
            type="button"
            className={
              tone === "danger" ? "btn btn-danger-solid" : "btn btn-primary"
            }
            onClick={confirm}
          >
            {request.confirmLabel ?? "확인"}
          </button>
        )}
      </div>
    </dialog>
  );
};
