import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { alarmConfig } from "../../config/alarm.config";
import { LinkStatus } from "../../state/link-state";
import { PlcPointEntry } from "../../state/plc-point-state";
import { RobotEntry } from "../../state/robot-state";
import { AlarmCandidate } from "../alarm.types";

/** 장비와 연결 상태로 알람 5종을 판정한다. */
@Injectable()
export class AlarmJudgeProvider {
  constructor(
    @Inject(alarmConfig.KEY)
    private readonly config: ConfigType<typeof alarmConfig>,
  ) {}

  async judgeRobot(
    robot: RobotEntry,
    stale: boolean,
    linkStatus: LinkStatus,
  ): Promise<AlarmCandidate[]> {
    const state = robot.state;
    const batteryPct = state?.batteryPct ?? 100;

    return [
      {
        code: "ROBOT_ERROR",
        level: "CRITICAL",
        targetType: "DEVICE",
        targetId: robot.deviceId,
        message: `${robot.name} 오류 ${state?.errorCode ?? ""}`.trim(),
        active: state?.opState === "ERROR",
      },
      {
        code: "LOW_BATTERY",
        level: "WARN",
        targetType: "DEVICE",
        targetId: robot.deviceId,
        message: `${robot.name} 배터리 ${Math.round(batteryPct)}%`,
        active: batteryPct < this.config.lowBatteryPct,
      },
      this.toStaleCandidate(robot.deviceId, robot.name, stale, linkStatus),
    ];
  }

  async judgePlcDevice(
    deviceId: string,
    stale: boolean,
    linkStatus: LinkStatus,
  ): Promise<AlarmCandidate> {
    return this.toStaleCandidate(deviceId, "PLC", stale, linkStatus);
  }

  /** 연결이 끊기면 소속 장비마다 알람을 여는 대신 연결 알람 하나만 연다. */
  async judgeLink(
    connectionId: string,
    linkStatus: LinkStatus,
    deviceCount: number,
  ): Promise<AlarmCandidate> {
    return {
      code: "LINK_DOWN",
      level: "CRITICAL",
      targetType: "CONNECTION",
      targetId: connectionId,
      message: `연결 끊김, 소속 장비 ${deviceCount}대 데이터 끊김`,
      active: linkStatus === "DOWN",
    };
  }

  /** 알람을 켜 둔 점만 판정한다. 값을 아직 모르면 열지 않는다. */
  async judgePlcPoint(point: PlcPointEntry): Promise<AlarmCandidate | null> {
    if (!point.alarmOnAbnormal) {
      return null;
    }

    const value = point.current?.value;
    return {
      code: "PLC_ABNORMAL",
      level: "CRITICAL",
      targetType: "PLC_POINT",
      targetId: point.pointId,
      message: `${point.name} 비정상`,
      active: value !== undefined && value !== point.normalValue,
    };
  }

  /**
   * 연결이 UP일 때만 연다. 연결 판정 전(UNKNOWN)에는 재시작 직후의 오래된 상태로 열지 않고,
   * DOWN이면 LINK_DOWN 알람 하나가 대신한다.
   */
  private toStaleCandidate(
    deviceId: string,
    name: string,
    stale: boolean,
    linkStatus: LinkStatus,
  ): AlarmCandidate {
    return {
      code: "DEVICE_STALE",
      level: "WARN",
      targetType: "DEVICE",
      targetId: deviceId,
      message: `${name} 데이터 끊김`,
      active: stale && linkStatus === "UP",
    };
  }
}
