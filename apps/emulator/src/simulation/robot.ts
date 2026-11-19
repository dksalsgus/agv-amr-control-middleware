import { MAP_HEIGHT_M, MAP_WIDTH_M } from "../config";

export type RobotMode = "IDLE" | "DRIVING" | "CHARGING";

const DRIVE_SPEED_M_S = 1;
const ARRIVE_DISTANCE_M = 0.5;
const BATTERY_DRAIN_PCT_PER_S = 0.05;
const BATTERY_CHARGE_PCT_PER_S = 1;
const LOW_BATTERY_PCT = 20;
const FULL_BATTERY_PCT = 100;

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

/**
 * 로봇 한 대의 움직임을 모사한다. 단위는 m, rad, m/s, %.
 * 맵 안의 임의 지점을 목표로 달리고, 배터리가 낮으면 제자리에서 충전한다.
 */
export class Robot {
  seq = 0;
  x: number;
  y: number;
  theta = 0;
  speed = 0;
  batteryPct: number;
  mode: RobotMode = "DRIVING";
  loaded = false;

  private targetX: number;
  private targetY: number;

  constructor(readonly serial: string) {
    this.x = randomBetween(0, MAP_WIDTH_M);
    this.y = randomBetween(0, MAP_HEIGHT_M);
    this.batteryPct = randomBetween(50, FULL_BATTERY_PCT);
    this.targetX = randomBetween(0, MAP_WIDTH_M);
    this.targetY = randomBetween(0, MAP_HEIGHT_M);
  }

  step(dtSec: number) {
    if (this.mode === "CHARGING") {
      this.charge(dtSec);
    } else {
      this.drive(dtSec);
    }

    this.seq += 1;
  }

  setTarget(x: number, y: number) {
    this.targetX = x;
    this.targetY = y;
  }

  private drive(dtSec: number) {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= ARRIVE_DISTANCE_M) {
      this.arrive();
      return;
    }

    const travel = Math.min(DRIVE_SPEED_M_S * dtSec, distance);
    this.theta = Math.atan2(dy, dx);
    this.x += (dx / distance) * travel;
    this.y += (dy / distance) * travel;
    this.speed = travel / dtSec;
    this.mode = "DRIVING";

    this.batteryPct = Math.max(
      0,
      this.batteryPct - BATTERY_DRAIN_PCT_PER_S * dtSec,
    );
    if (this.batteryPct < LOW_BATTERY_PCT) {
      this.startCharging();
    }
  }

  private arrive() {
    this.loaded = !this.loaded;
    this.setTarget(
      randomBetween(0, MAP_WIDTH_M),
      randomBetween(0, MAP_HEIGHT_M),
    );
  }

  private startCharging() {
    this.mode = "CHARGING";
    this.speed = 0;
  }

  private charge(dtSec: number) {
    this.batteryPct = Math.min(
      FULL_BATTERY_PCT,
      this.batteryPct + BATTERY_CHARGE_PCT_PER_S * dtSec,
    );

    if (this.batteryPct >= FULL_BATTERY_PCT) {
      this.mode = "IDLE";
    }
  }
}
