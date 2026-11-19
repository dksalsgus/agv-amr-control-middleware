import { CSSProperties } from "react";
import { Gnb, LivePill } from "../components/gnb";
import { Icon } from "../components/icon";
import { LogDetail } from "../logs/log-detail";
import { LogFilters } from "../logs/log-filters";
import { LogPager } from "../logs/log-pager";
import { LogScope } from "../logs/log-scope";
import { LogTable } from "../logs/log-table";
import { useLogHistory } from "../logs/use-log-history";
import { SocketStatus } from "../realtime/realtime.types";
import { useRealtime } from "../realtime/use-realtime";
import "../styles/logs.css";

const LIVE_PILL: Record<SocketStatus, LivePill> = {
  OPEN: { tone: "ok", text: "서버 연결됨", pulse: false },
  CONNECTING: { tone: "info", text: "접속 중", pulse: false },
  DISCONNECTED: { tone: "danger", text: "서버 연결 끊김", pulse: false },
};

/** 이력 화면. 디자인 기준은 docs/design/logs.html */
export const LogsPage = () => {
  const view = useRealtime();
  const history = useLogHistory(view);
  const { filter, status } = history;
  const settled = status === "ok" || status === "empty";

  return (
    <div className="app" data-page="logs">
      <Gnb live={LIVE_PILL[view.status]} />
      <section className="page-head">
        <div
          className="od-stack"
          style={{ "--od-gap": "2px" } as CSSProperties}
        >
          <h1 className="page-title">이력</h1>
          <p className="page-desc">
            연결 상태 변화와 알람 발생·확인·해제 기록입니다. 최신 기록이 맨 위에
            옵니다.
          </p>
        </div>
        <button
          type="button"
          className="btn"
          id="refreshBtn"
          onClick={() => history.refresh("#refreshBtn")}
        >
          <Icon name="refresh" />
          새로 고침
        </button>
      </section>

      <main className="workspace">
        <section className="list-col" aria-labelledby="listTitle">
          <h2 className="sr-only" id="listTitle">
            이력 목록
          </h2>
          <LogFilters
            filter={filter}
            counts={history.counts}
            options={history.options}
            nameOf={history.nameOf}
            onType={history.setType}
            onTargetType={history.setTargetType}
            onTargetId={history.setTargetId}
            onReset={history.reset}
          />
          {filter.targetType !== "ALL" && filter.targetId !== "ALL" && (
            <LogScope
              targetType={filter.targetType}
              name={history.nameOf(filter.targetId)}
              total={settled ? history.total : null}
              onClear={history.clearTarget}
            />
          )}
          <LogTable
            status={status}
            items={history.items}
            filter={filter}
            page={history.page}
            failure={history.failure}
            selectedId={history.selected?.id ?? null}
            nameOf={history.nameOf}
            onSelect={history.select}
            onScope={history.scopeTo}
            onReset={history.reset}
            onRetry={() => history.refresh(null)}
          />
          <LogPager
            status={status}
            page={history.page}
            total={history.total}
            onPage={history.goPage}
          />
        </section>

        <aside className="detail" aria-labelledby="detailTitle">
          <div className="detail-head">
            <h2 className="panel-title" id="detailTitle" tabIndex={-1}>
              로그 상세
            </h2>
          </div>
          <LogDetail
            log={history.selected}
            recent={history.recent}
            filter={filter}
            nameOf={history.nameOf}
            onSelect={history.select}
            onScope={history.scopeTo}
            onClear={history.clearTarget}
          />
        </aside>
      </main>
    </div>
  );
};
