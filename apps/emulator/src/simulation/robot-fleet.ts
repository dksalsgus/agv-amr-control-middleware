import { Robot } from "./robot";

/** 제조사 하나의 로봇 묶음. serial은 "{prefix}-001" */
export class RobotFleet {
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

  step(dtSec: number) {
    for (const robot of this.robots) {
      robot.step(dtSec);
    }

    this.sampledAt = new Date();
  }
}
