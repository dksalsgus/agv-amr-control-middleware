import { Robot } from "./robot";

/**
 * 제조사 하나에 속한 로봇 묶음. serial은 "{prefix}-001" 형태다.
 */
export class RobotFleet {
  readonly robots: Robot[];

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
  }
}
