import { CSSProperties } from "react";
import { formatAgo, formatTimeMs } from "../common/utils/format.util";
import { Icon } from "../components/icon";
import { OP_LABEL, OP_TONE } from "./monitor.constants";
import { MapRobot } from "./monitor.types";

type Props = {
  robot?: MapRobot;
  connectionName: string;
  vendorName: string;
  latency?: number;
  now: number;
};

const batteryLevel = (pct: number): string => {
  if (pct < 10) {
    return "critical";
  }
  return pct < 20 ? "low" : "ok";
};

const staleText = (stale: boolean, sinceMs: number): string => {
  const ago = formatAgo(sinceMs);
  if (stale) {
    return `예 · ${ago.replace(" 전", "")} 동안 수신 없음`;
  }
  return `아니요 · ${ago} 수신`;
};

/** 선택한 로봇 한 대의 현재 값 */
export const RobotDetail = ({
  robot,
  connectionName,
  vendorName,
  latency,
  now,
}: Props) => {
  if (!robot) {
    return (
      <div className="empty">
        <strong>선택한 로봇이 없습니다</strong>
        <span>맵에서 마커를 클릭하거나 ‘로봇 찾기’에 이름을 입력하세요.</span>
      </div>
    );
  }
  const sinceMs = now - Date.parse(robot.receivedTs);

  return (
    <>
      <div className="detail-head">
        <div className="od-field">
          <span className="detail-name">{robot.name}</span>
          <span className="detail-sub">
            {vendorName} · {robot.type} · {connectionName}
          </span>
        </div>
        <div className="detail-badges">
          <span className="badge" data-tone={OP_TONE[robot.opState]}>
            {OP_LABEL[robot.opState]}
          </span>
          {robot.stale && (
            <span className="badge" data-tone="stale">
              <Icon name="unplug" />
              STALE
            </span>
          )}
        </div>
      </div>
      <div className="battery">
        <div className="battery-row">
          <span className="kv-label">배터리</span>
          <span className="battery-val">
            <span>{Math.round(robot.batteryPct)}</span>%
          </span>
        </div>
        <div
          className="bar"
          data-level={batteryLevel(robot.batteryPct)}
          style={{ "--v": String(robot.batteryPct / 100) } as CSSProperties}
        >
          <span />
        </div>
      </div>
      <dl className="kv">
        <div className="od-field">
          <dt>제조사</dt>
          <dd>{vendorName}</dd>
        </div>
        <div className="od-field">
          <dt>유형</dt>
          <dd className="mono">{robot.type}</dd>
        </div>
        <div className="od-field span-2">
          <dt>연결 이름</dt>
          <dd>{connectionName}</dd>
        </div>
        <div className="od-field">
          <dt>운행 상태</dt>
          <dd>
            {OP_LABEL[robot.opState]} ({robot.opState})
          </dd>
        </div>
        <div className="od-field">
          <dt>속도</dt>
          <dd className="mono od-nowrap">{robot.speed.toFixed(2)} m/s</dd>
        </div>
        <div className="od-field">
          <dt>위치 (x, y)</dt>
          <dd className="mono od-nowrap">
            {robot.x.toFixed(2)}, {robot.y.toFixed(2)} m
          </dd>
        </div>
        <div className="od-field">
          <dt>방향</dt>
          <dd className="theta mono">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              aria-hidden="true"
              style={{ transform: `rotate(${-robot.theta}deg)` }}
            >
              <circle
                cx="8"
                cy="8"
                r="7"
                fill="none"
                stroke="var(--line-strong)"
              />
              <path
                d="M8 8 L14 8 M11.5 5.5 L14 8 L11.5 10.5"
                fill="none"
                stroke="var(--text-1)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{robot.theta.toFixed(1)}°</span>
          </dd>
        </div>
        <div className="od-field">
          <dt>적재</dt>
          <dd>{robot.loaded ? "적재" : "빈 상태"}</dd>
        </div>
        <div className="od-field">
          <dt>오류 코드</dt>
          <dd className="err-code mono" data-has={String(!!robot.errorCode)}>
            {robot.errorCode ?? "없음"}
          </dd>
        </div>
        <div className="od-field">
          <dt>마지막 seq</dt>
          <dd className="mono">{robot.seq.toLocaleString("ko-KR")}</dd>
        </div>
        <div className="od-field">
          <dt>종단 지연</dt>
          <dd className="mono od-nowrap">
            {latency === undefined ? "-" : Math.round(latency)} ms
          </dd>
        </div>
        <div className="od-field span-2">
          <dt>데이터 시각 (sourceTs)</dt>
          <dd className="mono">{formatTimeMs(Date.parse(robot.sourceTs))}</dd>
        </div>
        <div className="od-field span-2">
          <dt>STALE 여부</dt>
          <dd className={robot.stale ? "stale-yes" : ""}>
            {staleText(robot.stale, sinceMs)}
          </dd>
        </div>
      </dl>
    </>
  );
};
