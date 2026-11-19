import { CSSProperties } from "react";
import { formatTime } from "../common/utils/format.util";
import { Icon } from "../components/icon";
import { ConnectionPhase, ConnectionRow } from "./connections-view.types";
import { StatusBadge } from "./status-badge";

type Props = {
  creating: boolean;
  row?: ConnectionRow;
  phase?: ConnectionPhase;
  busy: boolean;
  onDelete: () => void;
};

const STACK_4 = { "--od-gap": "4px" } as CSSProperties;

/** 편집 영역 머리: 고른 연결의 이름·상태·version과 삭제 버튼 */
export const EditorHead = ({ creating, row, phase, busy, onDelete }: Props) => {
  if (creating) {
    return (
      <div className="editor-head">
        <div className="od-stack" style={STACK_4}>
          <h2 className="editor-title" id="editorTitle" tabIndex={-1}>
            새 연결
          </h2>
          <p className="editor-sub">
            저장하면 version 1로 만들어지고 바로 연결을 시도합니다.
          </p>
        </div>
      </div>
    );
  }
  if (!row) {
    return (
      <div className="editor-head">
        <h2 className="editor-title" id="editorTitle" tabIndex={-1}>
          연결을 고르세요
        </h2>
      </div>
    );
  }
  return (
    <div className="editor-head">
      <div className="od-stack" style={Object.assign({ minWidth: 0 }, STACK_4)}>
        <div className="editor-title-row">
          <h2 className="editor-title" id="editorTitle" tabIndex={-1}>
            {row.name}
          </h2>
          <StatusBadge status={row.status} phase={phase} />
          <span className="badge" data-tone={row.enabled ? "neutral" : "warn"}>
            {row.enabled ? "enabled 켬" : "enabled 끔"}
          </span>
        </div>
        <p className="editor-sub">
          {row.vendorName} · {row.protocol} ·{" "}
          <span className="mono">{row.id}</span>
        </p>
        <dl className="editor-facts">
          <div>
            <dt>version</dt>
            <dd>v{row.version}</dd>
          </div>
          <div>
            <dt>장비</dt>
            <dd>{row.deviceCount}대</dd>
          </div>
          <div>
            <dt>상태 변경</dt>
            <dd>
              {row.changedAt ? formatTime(Date.parse(row.changedAt)) : "-"}
            </dd>
          </div>
        </dl>
      </div>
      <button
        type="button"
        className="btn btn-danger"
        disabled={busy || phase !== undefined}
        onClick={onDelete}
      >
        <Icon name="trash" />
        삭제
      </button>
    </div>
  );
};
