import { RobotState } from "../state/robot-state";
import { StaleJudgeProvider } from "./stale-judge.provider";

describe("StaleJudgeProvider", () => {
  const judge = new StaleJudgeProvider();
  const now = new Date("2026-11-19T00:00:10Z");
  const at = (seconds: number) =>
    new Date(Date.parse("2026-11-19T00:00:00Z") + seconds * 1000);

  const robotState = (sourceSec: number, receivedSec: number): RobotState => ({
    seq: 1,
    sourceTs: at(sourceSec),
    receivedTs: at(receivedSec),
    x: 0,
    y: 0,
    theta: 0,
    speed: 0,
    batteryPct: 100,
    opState: "IDLE",
    errorCode: null,
    loaded: false,
  });

  it("최근에 받은 로봇은 STALE이 아니다", async () => {
    expect(await judge.isRobotStale(robotState(9, 9), "UP", now)).toBe(false);
  });

  it("3초 넘게 새 데이터가 없으면 STALE", async () => {
    expect(await judge.isRobotStale(robotState(6.9, 6.9), "UP", now)).toBe(
      true,
    );
  });

  it("발생 시각보다 3초 넘게 늦게 받았으면 STALE", async () => {
    expect(await judge.isRobotStale(robotState(5, 9), "UP", now)).toBe(true);
  });

  it("연결이 DOWN이거나 받은 적이 없으면 STALE", async () => {
    expect(await judge.isRobotStale(robotState(9, 9), "DOWN", now)).toBe(true);
    expect(await judge.isRobotStale(null, "UP", now)).toBe(true);
  });

  it("PLC는 1.5초 넘게 새 읽기가 없으면 STALE", async () => {
    const lastRead = (receivedSec: number) => ({
      seq: 1,
      sourceTs: at(receivedSec),
      receivedTs: at(receivedSec),
    });

    expect(await judge.isPlcStale(lastRead(9), "UP", now)).toBe(false);
    expect(await judge.isPlcStale(lastRead(8.4), "UP", now)).toBe(true);
  });
});
