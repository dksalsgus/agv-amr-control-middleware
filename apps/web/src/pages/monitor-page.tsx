import { useRealtime } from "../realtime/use-realtime";

/** WebSocket 상태만 보이는 임시 관제 화면. 디자인(docs/design/monitor.html)을 옮기면 바뀐다. */
export const MonitorPage = () => {
  const view = useRealtime();
  return (
    <main>
      <h1>관제</h1>
      <dl>
        <dt>서버 연결</dt>
        <dd data-testid="status">{view.status}</dd>
        <dt>rev</dt>
        <dd data-testid="rev">{view.rev}</dd>
        <dt>로봇</dt>
        <dd data-testid="robots">{view.robots.size}</dd>
        <dt>PLC 점</dt>
        <dd>{view.plcPoints.size}</dd>
        <dt>연결</dt>
        <dd>{view.links.size}</dd>
        <dt>열린 알람</dt>
        <dd>{view.alarms.size}</dd>
        <dt>마지막 복구 시간(ms)</dt>
        <dd data-testid="recovery">{view.lastRecoveryMs ?? "-"}</dd>
      </dl>
    </main>
  );
};
