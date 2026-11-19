import { KeyboardEvent, MouseEvent, useEffect, useRef, useState } from "react";
import { formatTime } from "../common/utils/format.util";
import { Icon } from "../components/icon";
import { PlcPoint } from "../realtime/realtime.types";
import { MAP_TICK_MS } from "./monitor.constants";
import { MapFilters, MapRobot } from "./monitor.types";
import { isVisible } from "./monitor.util";
import { MapRenderer, MapScene } from "./map-renderer";

type Props = {
  robots: MapRobot[];
  plcPoints: PlcPoint[];
  filters: MapFilters;
  selectedId: string | null;
  waiting: boolean;
  frozenAt: number | null;
  onSelect: (id: string | null) => void;
};

/** 다음·이전 보이는 로봇. 선택이 없으면 오른쪽은 처음, 왼쪽은 끝으로 간다. */
const stepSelection = (
  visible: MapRobot[],
  selectedId: string | null,
  key: string,
): string => {
  const index = visible.findIndex((robot) => robot.id === selectedId);
  if (key === "ArrowRight") {
    return visible[(index + 1) % visible.length].id;
  }
  return visible[index <= 0 ? visible.length - 1 : index - 1].id;
};

/** 공장 맵. 서버 delta 주기(100ms)마다 다시 그린다. */
export const RobotMap = (props: Props) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<MapRenderer | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const scene: MapScene = {
    robots: props.robots,
    plcPoints: props.plcPoints,
    filters: props.filters,
    selectedId: props.selectedId,
    hoverId,
    waiting: props.waiting,
  };
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) {
      return;
    }
    const renderer = new MapRenderer(canvas);
    rendererRef.current = renderer;
    const observer = new ResizeObserver(() => {
      const rect = stage.getBoundingClientRect();
      renderer.resize(rect.width, rect.height);
      renderer.draw(sceneRef.current);
    });
    observer.observe(stage);
    const timer = window.setInterval(
      () => renderer.draw(sceneRef.current),
      MAP_TICK_MS,
    );
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
      rendererRef.current = null;
    };
  }, []);

  const hitAt = (event: MouseEvent<HTMLCanvasElement>): MapRobot | null => {
    const renderer = rendererRef.current;
    if (!renderer || props.waiting) {
      return null;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    return renderer.hitTest(
      event.clientX - rect.left,
      event.clientY - rect.top,
      props.robots,
      props.filters,
    );
  };

  const onKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (props.waiting) {
      return;
    }
    if (event.key === "Escape") {
      props.onSelect(null);
      return;
    }
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }
    event.preventDefault();
    const visible = props.robots.filter((robot) =>
      isVisible(robot, props.filters),
    );
    if (visible.length > 0) {
      props.onSelect(stepSelection(visible, props.selectedId, event.key));
    }
  };

  return (
    <div className="map-stage" ref={stageRef}>
      <canvas
        ref={canvasRef}
        className={hoverId ? "is-hover" : undefined}
        tabIndex={0}
        role="img"
        aria-label="공장 맵 50m × 30m. 로봇을 클릭하거나 좌우 화살표 키로 선택합니다."
        onMouseMove={(event) => setHoverId(hitAt(event)?.id ?? null)}
        onMouseLeave={() => setHoverId(null)}
        onClick={(event) => {
          const hit = hitAt(event);
          if (hit) {
            props.onSelect(hit.id);
          }
        }}
        onKeyDown={onKeyDown}
      />
      {props.frozenAt !== null && (
        <div className="map-overlay">
          <Icon name="lock" size={14} />
          마지막 상태 ·{" "}
          <span className="mono">{formatTime(props.frozenAt)}</span> 기준
        </div>
      )}
      {props.waiting && (
        <div className="map-waiting">
          <strong>첫 스냅샷 대기 중</strong>
          <span className="muted">
            서버에 접속했습니다. 로봇 90대와 PLC 16점의 현재 상태를 받아오는
            중입니다.
          </span>
          <span className="progress" aria-hidden="true">
            <span />
          </span>
        </div>
      )}
    </div>
  );
};
