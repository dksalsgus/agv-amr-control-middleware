import { Robot } from "./robot";

/** 제조사 하나의 로봇 묶음. serial은 "{prefix}-001" */
export class RobotFleet {
  /** 장애 주입 오류 코드. 제조사 C 레지스터에 숫자로 들어가서 숫자로 둔다. */
  static readonly INJECTED_ERROR_CODE = 101;

  readonly robots: Robot[];
  /** 마지막으로 상태를 갱신한 시각. 폴링 방식 제조사가 발생 시각으로 쓴다. */
  sampledAt = new Date();

  constructor(prefix: string, count: number) {
    this.robots = Array.from(
      { length: count },
      (_, index) =>
        new Robot(`${prefix}-${String(index + 1).padStart(3, "0")}`),
    );
  }

  /** errorSerials에 든 로봇은 오류 코드를 달고 멈춘다. */
  step(dtSec: number, errorSerials: ReadonlySet<string>) {
    for (const robot of this.robots) {
      robot.errorCode = errorSerials.has(robot.serial)
        ? RobotFleet.INJECTED_ERROR_CODE
        : null;
      robot.step(dtSec);
    }

    this.sampledAt = new Date();
  }
}
