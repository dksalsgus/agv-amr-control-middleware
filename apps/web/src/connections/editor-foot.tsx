type Props = {
  creating: boolean;
  hasSelection: boolean;
  changedLabels: string[];
  busy: boolean;
  saving: boolean;
  onSave: () => void;
  onRevert: () => void;
  onCancel: () => void;
};

/** 편집 영역 아래 저장 바: 바뀐 항목 수와 저장·되돌리기 */
export const EditorFoot = (props: Props) => {
  if (props.creating) {
    return (
      <div className="editor-foot">
        <div className="dirty">
          <span className="dirty-count">새 연결 작성 중</span>
          <span className="foot-note">
            만들면 바로 연결을 시도합니다 · 다른 연결은 영향 없음
          </span>
        </div>
        <div className="foot-actions">
          <button
            type="button"
            className="btn"
            disabled={props.busy}
            onClick={props.onCancel}
          >
            취소
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={props.busy}
            onClick={props.onSave}
          >
            {props.busy ? "만드는 중…" : "연결 만들기"}
          </button>
        </div>
      </div>
    );
  }
  if (!props.hasSelection) {
    return <div className="editor-foot" />;
  }

  const count = props.changedLabels.length;
  const saveLabel = props.saving ? "저장 중…" : "저장";
  return (
    <div className="editor-foot">
      <div className="dirty">
        <span className="dirty-count" data-dirty={String(count > 0)}>
          {count > 0 ? `변경 사항 ${count}개` : "변경 사항 없음"}
        </span>
        <span className="foot-note od-truncate">
          {count > 0
            ? props.changedLabels.join(", ")
            : "저장하면 이 연결만 다시 붙습니다 · 다른 연결은 영향 없음"}
        </span>
      </div>
      <div className="foot-actions">
        <button
          type="button"
          className="btn"
          disabled={count === 0 || props.busy}
          onClick={props.onRevert}
        >
          되돌리기
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={count === 0 || props.busy}
          onClick={props.onSave}
        >
          {props.busy && !props.saving ? "재연결 중…" : saveLabel}
        </button>
      </div>
    </div>
  );
};
