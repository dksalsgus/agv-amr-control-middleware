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
  selectedPlcId: string | null;
  waiting: boolean;
  frozenAt: number | null;
  onSelect: (id: string | null) => void;
  onSelectPlc: (id: string) => void;
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
  const [hoverPlc, setHoverPlc] = useState(false);
  const scene: MapScene = {
    robots: props.robots,
    plcPoints: props.plcPoints,
    filters: props.filters,
    selectedId: props.selectedId,
    selectedPlcId: props.selectedPlcId,
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

  const plcHitAt = (event: MouseEvent<HTMLCanvasElement>): PlcPoint | null => {
    const renderer = rendererRef.current;
    if (!renderer || props.waiting) {
      return null;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    return renderer.hitTestPlc(
      event.clientX - rect.left,
      event.clientY - rect.top,
      props.plcPoints,
    );
  };

  const onMouseMove = (event: MouseEvent<HTMLCanvasElement>) => {
    const robot = hitAt(event);
    setHoverId(robot?.id ?? null);
    setHoverPlc(robot === null && plcHitAt(event) !== null);
  };

  /** 로봇이 먼저다. 로봇이 없는 곳이면 PLC 점을 고른다. */
  const onClick = (event: MouseEvent<HTMLCanvasElement>) => {
    const robot = hitAt(event);
    if (robot) {
      props.onSelect(robot.id);
      return;
    }
    const plc = plcHitAt(event);
    if (plc) {
      props.onSelectPlc(plc.id);
    }
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
        className={hoverId || hoverPlc ? "is-hover" : undefined}
        tabIndex={0}
        role="img"
        aria-label="공장 맵 50m × 30m. 로봇이나 PLC 표시를 클릭하거나 좌우 화살표 키로 로봇을 선택합니다."
        onMouseMove={onMouseMove}
        onMouseLeave={() => {
          setHoverId(null);
          setHoverPlc(false);
        }}
        onClick={onClick}
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
