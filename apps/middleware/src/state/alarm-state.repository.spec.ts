import { AlarmEntry } from "./alarm-state";
import { AlarmStateRepository } from "./alarm-state.repository";

const toEntry = (id: string, ackedAt: Date | null): AlarmEntry => ({
  id,
  code: "ROBOT_ERROR",
  level: "CRITICAL",
  targetType: "DEVICE",
  targetId: "device-1",
  message: "오류",
  raisedAt: new Date(0),
  ackedAt,
  rev: 1,
});

describe("AlarmStateRepository.replace", () => {
  it("같은 알람이 열려 있으면 바꾼다", async () => {
    const repository = new AlarmStateRepository();
    await repository.save(toEntry("a", null));

    const replaced = await repository.replace(toEntry("a", new Date(1)));

    expect(replaced).toBe(true);
    expect((await repository.findById("a"))?.ackedAt).toEqual(new Date(1));
  });

  it("풀렸거나 다시 열린 알람은 바꾸지 않는다", async () => {
    const repository = new AlarmStateRepository();
    await repository.save(toEntry("b", null));

    const replaced = await repository.replace(toEntry("a", new Date(1)));

    expect(replaced).toBe(false);
    expect(await repository.findById("a")).toBeUndefined();
  });
});
