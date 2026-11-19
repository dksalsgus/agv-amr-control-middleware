import { CSSProperties } from "react";
import { formatTime } from "../common/utils/format.util";
import { Gnb, LivePill } from "../components/gnb";
import { Icon } from "../components/icon";
import { ToastList } from "../components/toast-list";
import { useToasts } from "../components/use-toasts";
import { FaultAlert } from "../faults/fault-alert";
import { FaultGroupCard } from "../faults/fault-group-card";
import { FaultPresets } from "../faults/fault-presets";
import { FaultSummary } from "../faults/fault-summary";
import { faultsOf } from "../faults/fault-draft.util";
import { EMULATOR_HOST, GROUPS } from "../faults/faults.constants";
import { FaultGroup } from "../faults/faults.types";
import { useFaultInjection } from "../faults/use-fault-injection";
import { SocketStatus } from "../realtime/realtime.types";
import { useRealtime } from "../realtime/use-realtime";
import "../styles/faults.css";

const LIVE_PILL: Record<SocketStatus, LivePill> = {
  OPEN: { tone: "ok", text: "서버 연결됨", pulse: false },
  CONNECTING: { tone: "info", text: "접속 중", pulse: false },
  DISCONNECTED: { tone: "danger", text: "서버 연결 끊김", pulse: false },
};

const SKELETON_BARS = [0, 1, 2, 3, 4];

const gotoCard = (group: FaultGroup) => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document
    .getElementById(`card-${group}`)
    ?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  document.getElementById(`t-${group}`)?.focus({ preventScroll: true });
};

/** 장애 주입 화면. 디자인 기준은 docs/design/faults.html */
export const FaultsPage = () => {
  const view = useRealtime();
  const { toasts, push } = useToasts();
  const faults = useFaultInjection(push);
  const { status, groups } = faults;

  const anyFault =
    status === "ready" &&
    groups !== null &&
    GROUPS.some((def) => faultsOf(groups[def.id].applied).length > 0);
  const anyBusy =
    groups !== null &&
    GROUPS.some((def) => groups[def.id].phase === "applying");

  const fetchedText = () => {
    if (status === "loading") {
      return "현재 값을 불러오는 중…";
    }
    return faults.fetchedAt === null
      ? "현재 값을 읽지 못했습니다"
      : `마지막으로 읽은 시각 ${formatTime(faults.fetchedAt)}`;
  };

  return (
    <div className="app" data-page="faults">
      <Gnb live={LIVE_PILL[view.status]} />
      <section className="page-head">
        <div
          className="od-stack"
          style={{ "--od-gap": "2px" } as CSSProperties}
        >
          <h1 className="page-title">장애 주입</h1>
          <p className="page-desc">
            에뮬레이터(가짜 현장 장비)에 장애를 일부러 일으켜 미들웨어가 잘
            버티는지 시연합니다. 적용하면 해당 그룹에 바로 반영됩니다.
          </p>
        </div>
        <div className="page-actions">
          <div className="emu-meta">
            <span>
              에뮬레이터 <span className="mono">{EMULATOR_HOST}</span>
            </span>
            <span>{fetchedText()}</span>
          </div>
          <button
            type="button"
            className="btn btn-danger"
            disabled={!anyFault || anyBusy}
            onClick={faults.resetAll}
          >
            전체 초기화
          </button>
        </div>
      </section>

      {faults.alert && (
        <FaultAlert failure={faults.alert} onRetry={faults.retryAlert} />
      )}

      <div className="main-scroll">
        <div className="main-inner">
          <section aria-labelledby="sumTitle">
            <div className="section-head">
              <h2 className="section-title" id="sumTitle">
                지금 걸린 장애
              </h2>
            </div>
            <FaultSummary status={status} groups={groups} onGoto={gotoCard} />
          </section>
          <section aria-labelledby="presetTitle">
            <div className="section-head">
              <h2 className="section-title" id="presetTitle">
                시연용 빠른 설정
              </h2>
              <span className="section-meta">
                누르면 해당 그룹에 바로 적용합니다. 한 번 더 누르면 그 항목만
                정상으로 돌립니다.
              </span>
            </div>
            <FaultPresets
              groups={status === "ready" ? groups : null}
              onToggle={faults.togglePreset}
            />
          </section>
          <section aria-labelledby="groupTitle">
            <div className="section-head">
              <h2 className="section-title" id="groupTitle">
                그룹별 설정
              </h2>
              <span className="section-meta mono">
                GET /faults · PUT /faults/{"{group}"}
              </span>
            </div>
            <div className="groups" aria-busy={status === "loading"}>
              {status === "loading" &&
                GROUPS.map((def) => (
                  <div key={def.id} className="skel-card" aria-hidden="true">
                    <span className="skel-bar tall" style={{ width: "40%" }} />
                    {SKELETON_BARS.map((bar) => (
                      <span key={bar} className="skel-bar" />
                    ))}
                    <span
                      className="skel-bar tall"
                      style={{ width: "60%", justifySelf: "end" }}
                    />
                  </div>
                ))}
              {status === "error" && (
                <div className="state-box" style={{ gridColumn: "1/-1" }}>
                  <Icon name="unplug" size={32} />
                  <strong>에뮬레이터의 현재 값을 읽지 못했습니다</strong>
                  <span>
                    에뮬레이터가 꺼져 있거나 네트워크가 막혀 있을 수 있습니다.
                    에뮬레이터를 확인한 뒤 다시 시도하세요.
                  </span>
                  {faults.alert && (
                    <span className="mono">
                      GET /faults → {faults.alert.reason}
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={faults.load}
                  >
                    <Icon name="refresh" />
                    다시 불러오기
                  </button>
                </div>
              )}
              {status === "ready" &&
                groups &&
                GROUPS.map((def) => (
                  <FaultGroupCard
                    key={def.id}
                    def={def}
                    state={groups[def.id]}
                    onToggleDisconnected={() =>
                      faults.toggleDisconnected(def.id)
                    }
                    onChange={(key, raw) =>
                      faults.changeField(def.id, key, raw)
                    }
                    onRevert={() => faults.revert(def.id)}
                    onNormal={() => faults.setNormal(def.id)}
                    onApply={() => faults.apply(def.id)}
                  />
                ))}
            </div>
          </section>
        </div>
      </div>
      <ToastList toasts={toasts} />
    </div>
  );
};
