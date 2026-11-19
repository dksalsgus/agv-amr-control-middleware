import { clamp } from "../common/utils/format.util";
import { PlcPoint } from "../realtime/realtime.types";
import {
  AISLE_X,
  AISLE_Y,
  CHARGERS,
  MAP_HEIGHT_M,
  MAP_WIDTH_M,
  OP_LABEL,
  PLC_POSITIONS,
} from "./monitor.constants";
import { MapFilters, MapRobot, VendorKey } from "./monitor.types";
import { isVisible } from "./monitor.util";

type Colors = Record<string, string>;

export type MapScene = {
  robots: MapRobot[];
  plcPoints: PlcPoint[];
  filters: MapFilters;
  selectedId: string | null;
  hoverId: string | null;
  waiting: boolean;
};

/** 0부터 max까지 step 간격 눈금 */
const ticks = (max: number, step: number): number[] =>
  Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step);
const GRID_X = ticks(MAP_WIDTH_M, 5);
const GRID_Y = ticks(MAP_HEIGHT_M, 5);
const RACK_ROWS = [0, 1, 2];

const PAD = { l: 36, r: 16, t: 16, b: 28 };
const PLC_TAG: Record<string, string> = {
  DOOR: "D",
  INTERSECTION: "X",
  ESTOP: "E",
};

const COLOR_VARS: Record<string, string> = {
  floor: "--map-floor",
  grid: "--map-grid",
  rack: "--map-rack",
  rackLine: "--map-rack-line",
  aisle: "--map-aisle",
  wall: "--map-wall",
  label: "--map-label",
  marker: "--map-marker-line",
  text1: "--text-1",
  text2: "--text-2",
  bg: "--bg",
  accent: "--accent",
  MOVING: "--st-moving",
  IDLE: "--st-idle",
  CHARGING: "--st-charging",
  PAUSED: "--st-paused",
  ERROR: "--st-error",
  STALE: "--st-stale",
  critical: "--sev-critical",
  surface: "--surface-2",
  sans: "--font-sans",
  mono: "--font-mono",
};

/**
 * 공장 맵을 Canvas 2D로 그린다. 좌표는 미터이고 원점은 왼쪽 아래, y는 위쪽이다.
 * 그리는 방식은 docs/design/monitor.html의 맵 코드를 그대로 따른다.
 */
export class MapRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly colors: Colors;
  private readonly reducedMotion: MediaQueryList;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private scale = 1;
  private ox = 0;
  private oy = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D를 쓸 수 없습니다.");
    }
    this.ctx = ctx;
    this.colors = this.readColors();
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  }

  resize(width: number, height: number): void {
    this.dpr = window.devicePixelRatio || 1;
    this.width = width;
    this.height = height;
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    const innerW = width - PAD.l - PAD.r;
    const innerH = height - PAD.t - PAD.b;
    this.scale = Math.min(innerW / MAP_WIDTH_M, innerH / MAP_HEIGHT_M);
    this.ox = PAD.l + (innerW - MAP_WIDTH_M * this.scale) / 2;
    this.oy = PAD.t + (innerH - MAP_HEIGHT_M * this.scale) / 2;
  }

  draw(scene: MapScene): void {
    if (!this.width) {
      return;
    }
    const t = performance.now();
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.drawFloor();
    if (scene.waiting) {
      return;
    }
    this.drawPlcMarks(scene.plcPoints, t);

    const front = [scene.hoverId, scene.selectedId];
    const back = scene.robots
      .filter((robot) => !front.includes(robot.id))
      .sort(
        (a, b) =>
          Number(isVisible(a, scene.filters)) -
          Number(isVisible(b, scene.filters)),
      );
    back.forEach((robot) => this.drawRobot(robot, scene, t));
    const hover = scene.robots.find(
      (robot) => robot.id === scene.hoverId && robot.id !== scene.selectedId,
    );
    if (hover) {
      this.drawRobot(hover, scene, t);
    }
    const selected = scene.robots.find(
      (robot) => robot.id === scene.selectedId,
    );
    if (selected) {
      this.drawRobot(selected, scene, t);
    }
  }

  /** 마우스 위치(px)에서 가장 가까운 보이는 로봇 */
  hitTest(
    mx: number,
    my: number,
    robots: MapRobot[],
    filters: MapFilters,
  ): MapRobot | null {
    const limit = this.markerRadius() + 6;
    return (
      robots
        .filter((robot) => isVisible(robot, filters))
        .map((robot) => ({
          robot,
          distance: Math.hypot(this.sx(robot.x) - mx, this.sy(robot.y) - my),
        }))
        .filter((hit) => hit.distance < limit)
        .reduce<{ robot: MapRobot; distance: number } | null>(
          (best, hit) => (best && best.distance <= hit.distance ? best : hit),
          null,
        )?.robot ?? null
    );
  }

  private readColors(): Colors {
    const style = getComputedStyle(document.documentElement);
    return Object.fromEntries(
      Object.entries(COLOR_VARS).map(([key, name]) => [
        key,
        style.getPropertyValue(name).trim(),
      ]),
    );
  }

  private sx(x: number): number {
    return this.ox + x * this.scale;
  }

  private sy(y: number): number {
    return this.oy + (MAP_HEIGHT_M - y) * this.scale;
  }

  private markerRadius(): number {
    return clamp(this.scale * 0.36, 4.5, 9);
  }

  private drawFloor(): void {
    const ctx = this.ctx;
    const c = this.colors;
    const s = this.scale;
    ctx.fillStyle = c.floor;
    ctx.fillRect(0, 0, this.width, this.height);

    // 5m 격자
    ctx.strokeStyle = c.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    GRID_X.forEach((x) => {
      ctx.moveTo(Math.round(this.sx(x)) + 0.5, this.sy(0));
      ctx.lineTo(Math.round(this.sx(x)) + 0.5, this.sy(MAP_HEIGHT_M));
    });
    GRID_Y.forEach((y) => {
      ctx.moveTo(this.sx(0), Math.round(this.sy(y)) + 0.5);
      ctx.lineTo(this.sx(MAP_WIDTH_M), Math.round(this.sy(y)) + 0.5);
    });
    ctx.stroke();

    // 랙: 통로 사이 블록을 위아래 둘로 나눈다
    ctx.fillStyle = c.rack;
    ctx.strokeStyle = c.rackLine;
    AISLE_X.slice(0, -1).forEach((left, i) => {
      RACK_ROWS.forEach((j) => {
        const x0 = left + 1.3;
        const x1 = AISLE_X[i + 1] - 1.3;
        const y0 = AISLE_Y[j] + 1.3;
        const y1 = AISLE_Y[j + 1] - 1.3;
        const mid = (y0 + y1) / 2;
        const blocks = [
          [y0, mid - 0.3],
          [mid + 0.3, y1],
        ];
        blocks.forEach(([a, b]) => {
          ctx.fillRect(this.sx(x0), this.sy(b), (x1 - x0) * s, (b - a) * s);
          ctx.strokeRect(
            Math.round(this.sx(x0)) + 0.5,
            Math.round(this.sy(b)) + 0.5,
            Math.round((x1 - x0) * s),
            Math.round((b - a) * s),
          );
        });
      });
    });

    // 통로
    ctx.strokeStyle = c.aisle;
    ctx.lineWidth = Math.max(1, s * 0.12);
    ctx.setLineDash([s * 0.6, s * 0.4]);
    ctx.beginPath();
    const firstY = AISLE_Y[0];
    const lastY = AISLE_Y[AISLE_Y.length - 1];
    const firstX = AISLE_X[0];
    const lastX = AISLE_X[AISLE_X.length - 1];
    AISLE_X.forEach((x) => {
      ctx.moveTo(this.sx(x), this.sy(firstY));
      ctx.lineTo(this.sx(x), this.sy(lastY));
    });
    AISLE_Y.forEach((y) => {
      ctx.moveTo(this.sx(firstX), this.sy(y));
      ctx.lineTo(this.sx(lastX), this.sy(y));
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // 충전 구역
    ctx.strokeStyle = c.CHARGING;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    CHARGERS.forEach((charger) =>
      ctx.strokeRect(
        this.sx(charger.x - 0.6),
        this.sy(charger.y + 0.6),
        1.2 * s,
        1.2 * s,
      ),
    );
    ctx.globalAlpha = 1;

    // 외벽
    ctx.strokeStyle = c.wall;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.sx(0),
      this.sy(MAP_HEIGHT_M),
      MAP_WIDTH_M * s,
      MAP_HEIGHT_M * s,
    );

    // 구역 이름
    ctx.fillStyle = c.label;
    ctx.font = `600 11px ${c.sans}`;
    ctx.textBaseline = "middle";
    ctx.fillText("출하장", this.sx(0.8), this.sy(29.2));
    ctx.fillText("충전 구역", this.sx(33), this.sy(2.4) - 2);

    // 눈금
    ctx.font = `10px ${c.mono}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    GRID_X.forEach((x) => ctx.fillText(String(x), this.sx(x), this.sy(0) + 6));
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    GRID_Y.forEach((y) => ctx.fillText(String(y), this.sx(0) - 6, this.sy(y)));
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("m", this.sx(MAP_WIDTH_M) + 4, this.sy(0) + 6);
  }

  private drawPlcMarks(points: PlcPoint[], t: number): void {
    const ctx = this.ctx;
    const c = this.colors;
    const s = this.scale;
    const counters = new Map<string, number>();
    ctx.font = `600 10px ${c.mono}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    points.forEach((point) => {
      const position = PLC_POSITIONS[point.pointNo];
      const tag = PLC_TAG[point.type];
      if (!position || !tag) {
        return;
      }
      const order = (counters.get(point.type) ?? 0) + 1;
      counters.set(point.type, order);
      const x = this.sx(position.x);
      const y = this.sy(position.y);
      const color = point.abnormal ? c.critical : c.label;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = point.abnormal ? 2 : 1.2;

      if (point.type === "DOOR") {
        ctx.lineWidth = point.abnormal ? 4 : 3;
        ctx.beginPath();
        ctx.moveTo(x, y - s * 1.2);
        ctx.lineTo(x, y + s * 1.2);
        ctx.stroke();
        const offset = position.x === 0 ? 12 : -12;
        ctx.fillText(`${tag}${order}`, x + offset, y);
      } else if (point.type === "INTERSECTION") {
        const k = s * 0.9;
        ctx.beginPath();
        ctx.rect(x - k, y - k, 2 * k, 2 * k);
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillText(`${tag}${order}`, x + k + 8, y - k - 2);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        if (point.abnormal) {
          ctx.fill();
        } else {
          ctx.stroke();
        }
        ctx.fillText(`${tag}${order}`, x + 14, y);
      }

      if (point.abnormal) {
        const pulse = this.reducedMotion.matches
          ? 0.6
          : 0.35 + 0.35 * Math.sin(t / 220);
        ctx.globalAlpha = pulse;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });
  }

  /** 제조사별 모양: A 원, B 사각, C 마름모 */
  private shapePath(vendor: VendorKey, r: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    if (vendor === "A") {
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      return;
    }
    if (vendor === "B") {
      ctx.rect(-r * 0.88, -r * 0.88, r * 1.76, r * 1.76);
      return;
    }
    const k = r * 1.18;
    ctx.moveTo(0, -k);
    ctx.lineTo(k, 0);
    ctx.lineTo(0, k);
    ctx.lineTo(-k, 0);
    ctx.closePath();
  }

  private robotAlpha(visible: boolean, stale: boolean): number {
    if (!visible) {
      return 0.1;
    }
    return stale ? 0.6 : 1;
  }

  private drawRobot(robot: MapRobot, scene: MapScene, t: number): void {
    const ctx = this.ctx;
    const c = this.colors;
    const r = this.markerRadius();
    const visible = isVisible(robot, scene.filters);
    const selected = robot.id === scene.selectedId;
    const hover = robot.id === scene.hoverId;

    ctx.save();
    ctx.translate(this.sx(robot.x), this.sy(robot.y));
    ctx.globalAlpha = this.robotAlpha(visible, robot.stale);

    // 방향 바늘. 화면 y가 아래쪽이라 각도 부호를 뒤집는다.
    const a = (-robot.theta * Math.PI) / 180;
    ctx.strokeStyle = c.marker;
    ctx.fillStyle = c.marker;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a) * (r + 6), Math.sin(a) * (r + 6));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r + 9), Math.sin(a) * (r + 9));
    ctx.lineTo(Math.cos(a + 0.5) * (r + 4.5), Math.sin(a + 0.5) * (r + 4.5));
    ctx.lineTo(Math.cos(a - 0.5) * (r + 4.5), Math.sin(a - 0.5) * (r + 4.5));
    ctx.closePath();
    ctx.fill();

    // 본체
    this.shapePath(robot.vendor, r);
    ctx.fillStyle = robot.stale ? c.STALE : c[robot.opState];
    ctx.fill();
    ctx.lineWidth = 1.5;
    if (robot.stale) {
      ctx.setLineDash([2.5, 2]);
      ctx.strokeStyle = c.text2;
    } else {
      ctx.strokeStyle = c.floor;
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 적재
    if (robot.loaded) {
      ctx.fillStyle = c.floor;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }

    // 오류 고리
    if (robot.opState === "ERROR" && !robot.stale && visible) {
      const pulse = this.reducedMotion.matches
        ? 1
        : 0.45 + 0.55 * Math.abs(Math.sin(t / 300));
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = c.ERROR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 선택
    if (selected) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r + 7, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    if (selected || (hover && visible)) {
      this.drawLabel(robot, r, selected);
    }
  }

  private drawLabel(robot: MapRobot, r: number, selected: boolean): void {
    const ctx = this.ctx;
    const c = this.colors;
    const x = this.sx(robot.x);
    const y = this.sy(robot.y) - r - 12;
    const state = robot.stale ? "끊김" : OP_LABEL[robot.opState];
    const text = `${robot.name} · ${state}`;
    ctx.font = `600 11px ${c.sans}`;
    const w = ctx.measureText(text).width + 12;
    const bx = clamp(x - w / 2, 2, this.width - w - 2);
    const by = Math.max(2, y - 18);
    ctx.fillStyle = selected ? c.accent : c.surface;
    ctx.globalAlpha = 0.95;
    ctx.fillRect(bx, by, w, 18);
    ctx.globalAlpha = 1;
    ctx.fillStyle = selected ? c.bg : c.text1;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, bx + 6, by + 9);
  }
}
