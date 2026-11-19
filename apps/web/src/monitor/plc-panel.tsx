import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { formatTime, pad2 } from "../common/utils/format.util";
import { Icon } from "../components/icon";
import { PlcPoint } from "../realtime/realtime.types";
import { toPlcMapTags } from "./monitor.util";

type Props = {
  points: PlcPoint[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

const onOff = (value: boolean | null): string => {
  if (value === null) {
    return "-";
  }
  return value ? "ON" : "OFF";
};

const PlcFlag = ({ point }: { point: PlcPoint }) => {
  if (point.abnormal) {
    return (
      <span className="plc-flag">
        <Icon name="warn" />
        비정상
      </span>
    );
  }
  return point.stale ? <span className="plc-flag is-stale">STALE</span> : null;
};

const PlcDetail = ({
  point,
  mapTag,
}: {
  point?: PlcPoint;
  mapTag?: string;
}) => {
  if (!point) {
    return <p className="muted">신호를 고르면 상세 값을 보여 줍니다.</p>;
  }
  const changedAt = point.changedAt ? Date.parse(point.changedAt) : null;
  return (
    <>
      <p className="plc-detail-title">
        점 {pad2(point.pointNo)} · {point.name}
      </p>
      <dl className="kv">
        <div className="od-field">
          <dt>맵 위치</dt>
          <dd className="mono">{mapTag ?? "맵에 표시 안 함"}</dd>
        </div>
        <div className="od-field">
          <dt>유형</dt>
          <dd className="mono">{point.type}</dd>
        </div>
        <div className="od-field">
          <dt>비정상 여부</dt>
          <dd>
            {point.abnormal ? (
              <span className="badge" data-tone="danger">
                비정상
              </span>
            ) : (
              <span className="badge" data-tone="ok">
                정상
              </span>
            )}
          </dd>
        </div>
        <div className="od-field">
          <dt>현재 값</dt>
          <dd className="mono">{onOff(point.value)}</dd>
        </div>
        <div className="od-field">
          <dt>정상 값</dt>
          <dd className="mono">{onOff(point.normalValue)}</dd>
        </div>
        <div className="od-field">
          <dt>마지막 변경</dt>
          <dd className="mono">
            {changedAt === null ? "-" : formatTime(changedAt)}
          </dd>
        </div>
        <div className="od-field">
          <dt>STALE</dt>
          <dd>
            {point.stale ? <span className="stale-yes">예</span> : "아니요"}
          </dd>
        </div>
      </dl>
      <Link
        className="btn btn-sm"
        style={{ textDecoration: "none", marginTop: "var(--sp-3)" }}
        to={`/logs?targetType=PLC_POINT&targetId=${encodeURIComponent(point.id)}`}
      >
        <Icon name="clock" />이 신호의 이력 보기
      </Link>
    </>
  );
};

/** 신호가 하나도 없으면 "모두 정상"이 아니라 "신호 없음"이다. */
const PlcSummaryBadge = (props: { total: number; abnormal: number }) => {
  if (props.total === 0) {
    return (
      <span className="badge" data-tone="neutral">
        신호 없음
      </span>
    );
  }
  if (props.abnormal > 0) {
    return (
      <span className="badge" data-tone="danger">
        <Icon name="warn" />
        비정상 {props.abnormal}
      </span>
    );
  }
  return (
    <span className="badge" data-tone="ok">
      모두 정상
    </span>
  );
};

/** PLC 신호 타일과 고른 신호의 상세 */
export const PlcPanel = ({ points, selectedId, onSelect }: Props) => {
  const abnormal = points.filter((point) => point.abnormal).length;
  const selected = points.find((point) => point.id === selectedId);
  const detailRef = useRef<HTMLDivElement>(null);

  // 맵에서 고르면 상세가 화면 밖에 있을 수 있어 보이는 곳까지 굴린다.
  useEffect(() => {
    if (selectedId === null) {
      return;
    }
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    detailRef.current?.scrollIntoView({
      block: "nearest",
      behavior: reduce ? "auto" : "smooth",
    });
  }, [selectedId]);

  return (
    <section className="panel" aria-labelledby="plcTitle">
      <div className="panel-head">
        <h2 className="panel-title" id="plcTitle">
          PLC 신호
        </h2>
        <span className="panel-meta">{points.length}점</span>
        <span className="end">
          <PlcSummaryBadge total={points.length} abnormal={abnormal} />
        </span>
      </div>
      <div className="skel">
        <i className="tall" />
        <i className="tall" />
        <i className="tall" />
        <i className="tall" />
        <i className="tall" />
      </div>
      <div className="data-only">
        <div
          className="plc-grid"
          role="group"
          aria-label={`PLC 신호 ${points.length}점`}
        >
          {points.map((point) => (
            <button
              key={point.id}
              type="button"
              className="plc-tile"
              data-abnormal={String(point.abnormal)}
              data-stale={String(point.stale)}
              aria-pressed={point.id === selectedId}
              aria-label={`점 ${point.pointNo} ${point.name}, 현재 ${onOff(point.value)}${point.abnormal ? ", 비정상" : ""}${point.stale ? ", STALE" : ""}`}
              onClick={() => onSelect(point.id)}
            >
              <span className="plc-top">
                <span className="plc-no">{pad2(point.pointNo)}</span>
                <PlcFlag point={point} />
                <span
                  className="plc-val"
                  data-on={String(point.value === true)}
                >
                  {onOff(point.value)}
                </span>
              </span>
              <span className="plc-name od-truncate">{point.name}</span>
            </button>
          ))}
        </div>
        {points.length === 0 && (
          <div className="empty">
            <strong>받는 PLC 신호가 없습니다</strong>
            PLC 연결이 꺼져 있거나 장비가 등록되지 않았습니다.
          </div>
        )}
        <div className="plc-detail" aria-live="polite" ref={detailRef}>
          <PlcDetail
            point={selected}
            mapTag={
              selected ? toPlcMapTags(points).get(selected.id) : undefined
            }
          />
        </div>
      </div>
    </section>
  );
};
