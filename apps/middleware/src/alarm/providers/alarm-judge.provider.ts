import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { alarmConfig } from "../../config/alarm.config";
import { PlcPointEntry } from "../../state/plc-point-state";
import { RobotEntry } from "../../state/robot-state";
import { AlarmCandidate } from "../alarm.types";

/** 장비 상태로 알람 4종을 판정한다. */
@Injectable()
export class AlarmJudgeProvider {
  constructor(
    @Inject(alarmConfig.KEY)
    private readonly config: ConfigType<typeof alarmConfig>,
  ) {}

  async judgeRobot(
    robot: RobotEntry,
    stale: boolean,
    canAlarmStale: boolean,
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
      this.toStaleCandidate(robot.deviceId, robot.name, stale, canAlarmStale),
    ];
  }

  async judgePlcDevice(
    deviceId: string,
    stale: boolean,
    canAlarmStale: boolean,
  ): Promise<AlarmCandidate> {
    return this.toStaleCandidate(deviceId, "PLC", stale, canAlarmStale);
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

  /** canAlarmStale은 연결 상태로 정한다(AlarmService.canAlarmStale). */
  private toStaleCandidate(
    deviceId: string,
    name: string,
    stale: boolean,
    canAlarmStale: boolean,
  ): AlarmCandidate {
    return {
      code: "DEVICE_STALE",
      level: "WARN",
      targetType: "DEVICE",
      targetId: deviceId,
      message: `${name} 데이터 끊김`,
      active: stale && canAlarmStale,
    };
  }
}
