import { alarmConfig } from "../../config/alarm.config";
import { PlcPointEntry } from "../../state/plc-point-state";
import { RobotEntry, RobotState } from "../../state/robot-state";
import { AlarmJudgeProvider } from "./alarm-judge.provider";

const toRobot = (opState: RobotState["opState"], batteryPct: number) =>
  ({
    deviceId: "r1",
    connectionId: "c1",
    externalId: "A-001",
    name: "AMR A-001",
    type: "AMR",
    rev: 1,
    state: {
      seq: 1,
      sourceTs: new Date(),
      receivedTs: new Date(),
      x: 0,
      y: 0,
      theta: 0,
      speed: 0,
      batteryPct,
      opState,
      errorCode: opState === "ERROR" ? "E-101" : null,
      loaded: false,
    },
  }) as RobotEntry;

const toPoint = (alarmOnAbnormal: boolean, value: boolean | null) =>
  ({
    pointId: "p1",
    deviceId: "plc",
    connectionId: "c2",
    pointNo: 0,
    name: "비상정지",
    type: "ESTOP",
    normalValue: false,
    alarmOnAbnormal,
    current:
      value === null
        ? null
        : { value, seq: 1, sourceTs: new Date(), receivedTs: new Date() },
    rev: 1,
  }) as PlcPointEntry;

describe("AlarmJudgeProvider", () => {
  const judge = new AlarmJudgeProvider(alarmConfig());

  const activeCodes = async (robot: RobotEntry, stale: boolean) =>
    (await judge.judgeRobot(robot, stale, "UP"))
      .filter((candidate) => candidate.active)
      .map((candidate) => candidate.code);

  it("ERROR 상태면 ROBOT_ERROR, 배터리 20% 미만이면 LOW_BATTERY를 연다", async () => {
    expect(await activeCodes(toRobot("ERROR", 50), false)).toEqual([
      "ROBOT_ERROR",
    ]);
    expect(await activeCodes(toRobot("MOVING", 19), false)).toEqual([
      "LOW_BATTERY",
    ]);
  });

  it("STALE이면 DEVICE_STALE을 열되, 연결 판정 전(UNKNOWN)에는 열지 않는다", async () => {
    expect(await activeCodes(toRobot("MOVING", 50), true)).toEqual([
      "DEVICE_STALE",
    ]);

    const unknown = await judge.judgeRobot(
      toRobot("MOVING", 50),
      true,
      "UNKNOWN",
    );
    expect(unknown.every((candidate) => !candidate.active)).toBe(true);
  });

  it("알람을 켠 점만 비정상 값에서 PLC_ABNORMAL을 연다", async () => {
    expect(await judge.judgePlcPoint(toPoint(false, true))).toBeNull();
    expect((await judge.judgePlcPoint(toPoint(true, true)))?.active).toBe(true);
    expect((await judge.judgePlcPoint(toPoint(true, false)))?.active).toBe(
      false,
    );
    expect((await judge.judgePlcPoint(toPoint(true, null)))?.active).toBe(
      false,
    );
  });
});
