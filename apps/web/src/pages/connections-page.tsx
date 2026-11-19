import { CSSProperties, FormEvent } from "react";
import { ConfirmDialog } from "../components/confirm-dialog";
import { Gnb, LivePill } from "../components/gnb";
import { Icon } from "../components/icon";
import { ToastList } from "../components/toast-list";
import { useToasts } from "../components/use-toasts";
import { ConnectionForm } from "../connections/connection-form";
import { ConnectionList } from "../connections/connection-list";
import { EditorFoot } from "../connections/editor-foot";
import { EditorHead } from "../connections/editor-head";
import { SaveFlowNotice } from "../connections/save-flow";
import { useConnectionEditor } from "../connections/use-connection-editor";
import { SocketStatus } from "../realtime/realtime.types";
import { useRealtime } from "../realtime/use-realtime";
import "../styles/connections.css";

const LIVE_PILL: Record<SocketStatus, LivePill> = {
  OPEN: { tone: "ok", text: "서버 연결됨", pulse: false },
  CONNECTING: { tone: "info", text: "접속 중", pulse: false },
  DISCONNECTED: { tone: "danger", text: "서버 연결 끊김", pulse: false },
};

const focusField = (key: string) => {
  const element = document.getElementById(`f-${key.replace(".", "-")}`);
  element?.scrollIntoView({ block: "center" });
  element?.focus();
};

/** 연결 설정 화면. 디자인 기준은 docs/design/connections.html */
export const ConnectionsPage = () => {
  const view = useRealtime();
  const { toasts, push } = useToasts();
  const editor = useConnectionEditor(view.links, push);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void editor.save();
  };

  const draftRow =
    editor.creating && editor.draft
      ? {
          name: editor.draft.name.trim() || "새 연결",
          sub: `${editor.draftVendorName} · ${editor.draft.protocol} · 작성 중`,
        }
      : null;

  return (
    <div className="app" data-page="connections">
      <Gnb live={LIVE_PILL[view.status]} />
      <section className="page-head">
        <div className="page-head-row">
          <div
            className="od-stack"
            style={{ "--od-gap": "2px" } as CSSProperties}
          >
            <h1 className="page-title">연결 설정</h1>
            <p className="page-desc">
              드롭다운과 토글로 프로토콜과 접속 정보를 바꾸면 재배포 없이 바로
              반영됩니다. 저장하면 해당 연결만 내렸다가 새 설정으로 다시
              붙습니다.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={editor.startCreate}
          >
            <Icon name="plus" />새 연결
          </button>
        </div>
      </section>

      <main className="workspace">
        <ConnectionList
          rows={editor.rows}
          selectedId={editor.selectedId}
          draftRow={draftRow}
          phases={editor.phases}
          busyId={editor.busy ? editor.selectedId : null}
          onPick={editor.select}
          onToggle={(id) => void editor.toggleEnabled(id)}
        />
        <section className="editor" aria-labelledby="editorTitle">
          <EditorHead
            creating={editor.creating}
            row={editor.row}
            phase={editor.row ? editor.phases.get(editor.row.id) : undefined}
            busy={editor.busy}
            onDelete={editor.askDelete}
          />
          <div className="editor-body">
            <div className="editor-inner">
              <div className="flow-host">
                <SaveFlowNotice
                  flow={editor.flow}
                  onGoto={focusField}
                  onRetry={() => void editor.retry()}
                  onEdit={editor.editAfterFailure}
                  onReload={() => void editor.reloadLatest()}
                  onRebase={() => void editor.rebase()}
                />
              </div>
              {editor.draft && (
                <form noValidate onSubmit={submit}>
                  <ConnectionForm
                    draft={editor.draft}
                    creating={editor.creating}
                    vendors={editor.vendors}
                    vendorName={editor.row?.vendorName ?? ""}
                    hasSavedPassword={editor.detail?.hasPassword ?? false}
                    errors={editor.errors}
                    disabled={editor.busy}
                    onChange={editor.change}
                    onBlur={editor.blur}
                  />
                  <button type="submit" hidden />
                </form>
              )}
            </div>
          </div>
          <EditorFoot
            creating={editor.creating}
            hasSelection={editor.row !== undefined}
            changedLabels={editor.changedLabels}
            busy={editor.busy}
            saving={editor.flow?.phase === "saving"}
            onSave={() => void editor.save()}
            onRevert={editor.revert}
            onCancel={editor.cancelCreate}
          />
        </section>
      </main>
      <ConfirmDialog request={editor.confirm} onClose={editor.closeConfirm} />
      <ToastList toasts={toasts} />
    </div>
  );
};
