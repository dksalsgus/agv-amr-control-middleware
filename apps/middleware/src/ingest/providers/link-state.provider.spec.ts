import { LogsRepository } from "../../history/logs.repository";
import { LinkStateRepository } from "../../state/link-state.repository";
import { LinkStateProvider } from "./link-state.provider";

describe("LinkStateProvider", () => {
  const insert = jest.fn();
  const logsRepository = { insert } as unknown as LogsRepository;
  const id = "conn-1";
  const linkStateRepository = new LinkStateRepository();
  const provider = new LinkStateProvider(linkStateRepository, logsRepository);

  beforeEach(async () => {
    insert.mockReset();
    await provider.register(id);
  });

  const findStatus = async () =>
    (await linkStateRepository.findById(id))?.status;

  it("폴링이 3번 연속 실패하면 DOWN이 되고 LINK_DOWN을 한 번 남긴다", async () => {
    await provider.markFailure(id, "B", "timeout");
    await provider.markFailure(id, "B", "timeout");
    expect(await findStatus()).toBe("UNKNOWN");

    await provider.markFailure(id, "B", "timeout");
    await provider.markFailure(id, "B", "timeout");

    expect(await findStatus()).toBe("DOWN");
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert.mock.calls[0][0]).toMatchObject({ type: "LINK_DOWN" });
  });

  it("DOWN 뒤 재시도 간격은 1초부터 두 배씩 늘고 10초에서 멈춘다", async () => {
    const expected = [null, null, 1000, 2000, 4000, 8000, 10000, 10000];

    for (const delayMs of expected) {
      await provider.markFailure(id, "B", "timeout");
      expect(await provider.findRetryDelayMs(id)).toBe(delayMs);
    }
  });

  it("성공하면 UP이 되고 실패 횟수를 지운다", async () => {
    await provider.markFailure(id, "B", "timeout");
    await provider.markUp(id, "B");
    await provider.markUp(id, "B");

    expect(await findStatus()).toBe("UP");
    expect(await provider.findRetryDelayMs(id)).toBeNull();
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert.mock.calls[0][0]).toMatchObject({ type: "LINK_UP" });
  });

  it("로그 기록이 실패해도 상태는 바뀐다", async () => {
    insert.mockRejectedValue(new Error("db down"));

    await provider.markDown(id, "A", "close");

    expect(await findStatus()).toBe("DOWN");
  });
});
