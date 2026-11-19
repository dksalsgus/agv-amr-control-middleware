import { randomBetween } from "../common/utils/random.util";
import { RouteMap } from "./route-map";
import { RouteNode } from "./route-map.types";
import { RobotMode } from "./robot.types";

/**
 * 로봇 한 대. 통로를 따라 적재장에서 짐을 싣고 작업대에 내리며,
 * 배터리가 낮으면 가장 가까운 충전소로 가서 충전한다. 단위 m, rad, m/s, %
 */
export class Robot {
  private static readonly ROUTE_MAP = new RouteMap();
  private static readonly DRIVE_SPEED_M_S = 1;
  private static readonly BATTERY_DRAIN_PCT_PER_S = 0.05;
  private static readonly BATTERY_CHARGE_PCT_PER_S = 1;
  private static readonly LOW_BATTERY_PCT = 20;
  private static readonly FULL_BATTERY_PCT = 100;

  seq = 0;
  x: number;
  y: number;
  theta = 0;
  speed = 0;
  batteryPct: number;
  mode: RobotMode = "DRIVING";
  loaded = false;

  /** 마지막으로 도착한 지점 */
  private currentNode: RouteNode;
  private waypoints: RouteNode[] = [];
  private headingToCharger = false;

  constructor(readonly serial: string) {
    this.currentNode = Robot.ROUTE_MAP.randomNode();
    this.x = this.currentNode.x;
    this.y = this.currentNode.y;
    this.batteryPct = randomBetween(50, Robot.FULL_BATTERY_PCT);
  }

  step(dtSec: number) {
    if (this.mode === "CHARGING") {
      this.charge(dtSec);
    } else {
      this.drive(dtSec);
    }

    this.seq += 1;
  }

  private drive(dtSec: number) {
    if (this.batteryPct < Robot.LOW_BATTERY_PCT && !this.headingToCharger) {
      this.routeToCharger();
    }

    if (this.waypoints.length === 0) {
      this.arrive();
      return;
    }

    this.moveTowardNextWaypoint(dtSec);
  }

  /** 지금 가던 통로는 끝까지 가고, 그 지점부터 가장 가까운 충전소로 경로를 바꾼다. */
  private routeToCharger() {
    const from =
      this.waypoints.length > 0 ? this.waypoints[0] : this.currentNode;
    const charger = Robot.ROUTE_MAP.nearestCharger(from);

    this.waypoints = this.waypoints
      .slice(0, 1)
      .concat(Robot.ROUTE_MAP.findPath(from, charger));
    this.headingToCharger = true;
  }

  private moveTowardNextWaypoint(dtSec: number) {
    const target = this.waypoints[0];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.hypot(dx, dy);
    const travel = Math.min(Robot.DRIVE_SPEED_M_S * dtSec, distance);

    if (distance > 0) {
      this.theta = Math.atan2(dy, dx);
      this.x += (dx / distance) * travel;
      this.y += (dy / distance) * travel;
    }
    this.speed = travel / dtSec;
    this.mode = "DRIVING";

    if (travel >= distance) {
      this.currentNode = target;
      this.waypoints.shift();
    }

    this.batteryPct = Math.max(
      0,
      this.batteryPct - Robot.BATTERY_DRAIN_PCT_PER_S * dtSec,
    );
  }

  /** 목적지에 닿은 다음 step. 한 step 멈춰 짐을 싣거나 내리고 다음 목적지를 정한다. */
  private arrive() {
    this.speed = 0;

    if (this.headingToCharger) {
      this.startCharging();
      return;
    }

    if (this.currentNode.kind === "STORAGE") {
      this.loaded = true;
    }
    if (this.currentNode.kind === "STATION") {
      this.loaded = false;
    }

    const destination = Robot.ROUTE_MAP.randomNode(
      this.loaded ? "STATION" : "STORAGE",
    );
    this.waypoints = Robot.ROUTE_MAP.findPath(this.currentNode, destination);
  }

  private startCharging() {
    this.mode = "CHARGING";
    this.speed = 0;
    this.headingToCharger = false;
  }

  private charge(dtSec: number) {
    this.batteryPct = Math.min(
      Robot.FULL_BATTERY_PCT,
      this.batteryPct + Robot.BATTERY_CHARGE_PCT_PER_S * dtSec,
    );

    if (this.batteryPct >= Robot.FULL_BATTERY_PCT) {
      this.mode = "IDLE";
    }
  }
}
