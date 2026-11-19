import { formatTime } from "../common/utils/format.util";
import { Icon } from "../components/icon";
import { SaveFlow } from "./connections-view.types";

type StepState = "pending" | "active" | "done" | "failed";
type StepText = { t?: string; d?: string };

const STEP_DEFS: [string, string][] = [
  ["저장 중", "설정 검증 후 version 올림"],
  ["재연결 중", "이 연결만 내렸다가 다시 붙음"],
  ["UP 확인", "새 설정으로 데이터 수신 확인"],
];

const StepMark = ({ state, index }: { state: StepState; index: number }) => {
  if (state === "done") {
    return <Icon name="check" size={14} />;
  }
  if (state === "failed") {
    return <Icon name="x" size={14} />;
  }
  return <span>{index + 1}</span>;
};

const Stepper = ({
  states,
  overrides,
}: {
  states: StepState[];
  overrides: StepText[];
}) => (
  <ol className="stepper" aria-label="저장 진행 단계">
    {STEP_DEFS.map(([title, desc], i) => (
      <li key={title} className="step" data-state={states[i]}>
        <span className="step-icon" aria-hidden="true">
          {states[i] === "active" ? null : (
            <StepMark state={states[i]} index={i} />
          )}
        </span>
        <span className="step-title">{overrides[i]?.t ?? title}</span>
        <span className="step-desc">{overrides[i]?.d ?? desc}</span>
      </li>
    ))}
  </ol>
);

type Props = {
  flow: SaveFlow | null;
  onGoto: (key: string) => void;
  onRetry: () => void;
  onEdit: () => void;
  onReload: () => void;
  onRebase: () => void;
};

/** 저장 진행 단계와 결과 안내(400·409·연결 실패) */
export const SaveFlowNotice = ({
  flow,
  onGoto,
  onRetry,
  onEdit,
  onReload,
  onRebase,
}: Props) => {
  if (!flow) {
    return null;
  }

  switch (flow.phase) {
    case "saving":
      return (
        <Stepper states={["active", "pending", "pending"]} overrides={[]} />
      );
    case "reconnecting":
      return (
        <Stepper
          states={["done", "active", "pending"]}
          overrides={[{ d: `v${flow.version} 저장됨` }]}
        />
      );
    case "createdWaiting":
      return (
        <Stepper
          states={["done", "active", "pending"]}
          overrides={[{ t: "만들기", d: "v1 생성됨" }, { t: "연결 시작" }]}
        />
      );
    case "done":
      return (
        <Stepper
          states={["done", "done", "done"]}
          overrides={[
            { d: `v${flow.version} 저장됨` },
            { d: `${formatTime(flow.reconnectedAt)} 재연결` },
            {
              t: "새 설정으로 UP",
              d: `${formatTime(flow.at)} 데이터 수신 확인`,
            },
          ]}
        />
      );
    case "created":
      return (
        <Stepper
          states={["done", "done", "done"]}
          overrides={[
            { t: "만들기", d: "v1 생성됨" },
            {
              t: "연결 시작",
              d: `${formatTime(flow.reconnectedAt)} 어댑터 시작`,
            },
            { t: "UP 확인", d: `${formatTime(flow.at)} 데이터 수신 확인` },
          ]}
        />
      );
    case "failed":
      return (
        <>
          <Stepper
            states={["done", "done", "failed"]}
            overrides={[
              flow.created
                ? { t: "만들기", d: "v1 생성됨" }
                : { d: `v${flow.version} 저장됨` },
              {
                t: flow.created ? "연결 시작" : undefined,
                d: `${formatTime(flow.reconnectedAt)} 재연결 시도`,
              },
              {
                t: "연결 실패 · DOWN",
                d: `${formatTime(flow.at)} 새 설정으로 붙지 못함`,
              },
            ]}
          />
          <div className="notice" data-tone="danger" role="alert">
            <span className="notice-title" tabIndex={-1}>
              <Icon name="unplug" />
              저장은 됐지만 새 설정으로 연결하지 못했습니다
            </span>
            <span>
              설정은 v{flow.version}로 저장되었고 연결 상태는 DOWN입니다. 이
              연결에 딸린 장비는 관제 화면에서 STALE로 보입니다.
            </span>
            <div className="notice-actions">
              <button type="button" className="btn btn-sm" onClick={onRetry}>
                <Icon name="refresh" />
                다시 시도
              </button>
              <button type="button" className="btn btn-sm" onClick={onEdit}>
                설정 고치기
              </button>
            </div>
          </div>
        </>
      );
    case "invalid":
      return (
        <div className="notice" data-tone="danger" role="alert">
          <span className="notice-title" tabIndex={-1}>
            <Icon name="critical" />
            저장하지 못했습니다 · 400 입력 검증 실패
          </span>
          <span>
            {flow.messages.length}개 항목을 고쳐 주세요. 항목을 누르면 해당
            입력란으로 이동합니다. 연결은 기존 설정으로 계속 동작합니다.
          </span>
          <ul>
            {flow.messages.map((message) => (
              <li key={`${message.key}-${message.text}`}>
                {message.key ? (
                  <>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => onGoto(message.key ?? "")}
                    >
                      {message.label}
                    </button>{" "}
                    — {message.text}
                  </>
                ) : (
                  message.text
                )}
              </li>
            ))}
          </ul>
        </div>
      );
    case "conflict":
      return (
        <div className="notice" data-tone="warn" role="alert">
          <span className="notice-title" tabIndex={-1}>
            <Icon name="warn" />
            409 버전 충돌 · 다른 사용자가 먼저 수정했습니다
          </span>
          <span>
            다른 사용자가 이 연결을 v{flow.from} → v{flow.to}로 바꿨습니다. 내
            변경은 저장되지 않았고, 연결은 최신 설정(v{flow.to})으로 동작
            중입니다.
          </span>
          <table className="cmp">
            <thead>
              <tr>
                <th scope="col">항목</th>
                <th scope="col">내가 편집한 값</th>
                <th scope="col">최신 값 (v{flow.to})</th>
                <th scope="col">누가 바꿨나</th>
              </tr>
            </thead>
            <tbody>
              {flow.rows.map((row) => (
                <tr key={row.label} data-theirs={String(row.theirs)}>
                  <td>{row.label}</td>
                  <td className="v">{row.mine}</td>
                  <td className="v latest">{row.latest}</td>
                  <td className="who">{whoChanged(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="notice-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onReload}
            >
              <Icon name="refresh" />
              최신 값 다시 불러오기
            </button>
            <button type="button" className="btn btn-sm" onClick={onRebase}>
              내 변경 유지하고 계속 편집
            </button>
          </div>
        </div>
      );
    case "rebased":
      return (
        <div className="notice" data-tone="info" role="status">
          <span className="notice-title">
            <Icon name="info" />
            최신 버전 v{flow.to} 기준으로 계속 편집합니다
          </span>
          <span>
            저장하면 다른 사용자의 변경 중 내가 고친 항목은 내 값으로
            덮어씁니다.
          </span>
        </div>
      );
    case "savedDisabled":
      return (
        <div className="notice" data-tone="info" role="status">
          <span className="notice-title" tabIndex={-1}>
            <Icon name="check" />v{flow.version}로 저장했습니다
          </span>
          <span>
            이 연결은 enabled가 꺼져 있어 다시 붙지 않습니다. 목록에서 켜면 새
            설정으로 연결합니다.
          </span>
        </div>
      );
  }
};

const whoChanged = (row: {
  mine: string;
  latest: string;
  theirs: boolean;
  mineChanged: boolean;
}): string => {
  if (row.theirs && row.mine !== row.latest && row.mineChanged) {
    return "둘 다";
  }
  return row.theirs ? "다른 사용자" : "나";
};
