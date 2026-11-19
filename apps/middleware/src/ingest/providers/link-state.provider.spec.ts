import { linkConfig } from "../../config/link.config";
import { LogsRepository } from "../../history/logs.repository";
import { AppLogger } from "../../logger/app-logger";
import { LinkStateRepository } from "../../state/link-state.repository";
import { RemovedEntityRepository } from "../../state/removed-entity.repository";
import { RevisionRepository } from "../../state/revision.repository";
import { LinkStateProvider } from "./link-state.provider";

describe("LinkStateProvider", () => {
  const insert = jest.fn();
  const logsRepository = { insert } as unknown as LogsRepository;
  const id = "conn-1";
  const linkStateRepository = new LinkStateRepository();
  const removedEntityRepository = new RemovedEntityRepository();
  const provider = new LinkStateProvider(
    linkConfig(),
    linkStateRepository,
    logsRepository,
    new RevisionRepository(),
    removedEntityRepository,
    {
      setContext: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
    } as unknown as AppLogger,
  );

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

  it("rev는 상태가 바뀔 때만 오른다", async () => {
    const findRev = async () => (await linkStateRepository.findById(id))?.rev;
    const registered = await findRev();

    await provider.markFailure(id, "B", "timeout");
    expect(await findRev()).toBe(registered);

    await provider.markUp(id, "B");
    expect(await findRev()).toBeGreaterThan(registered ?? 0);
  });

  it("지우면 지운 시점의 rev로 removed에 남고, 다시 등록하면 사라진다", async () => {
    const before = (await linkStateRepository.findById(id))?.rev ?? 0;

    await provider.unregister(id);
    expect(await removedEntityRepository.findAfter(before)).toEqual([
      { kind: "LINK", id, rev: before + 1 },
    ]);

    await provider.register(id);
    expect(await removedEntityRepository.findAfter(before)).toEqual([]);
  });

  it("지운 뒤에 끝난 폴링은 링크를 되살리거나 로그를 남기지 않는다", async () => {
    await provider.unregister(id);

    await provider.markUp(id, "B");
    await provider.markFailure(id, "B", "timeout");
    await provider.markDown(id, "B", "close");

    expect(await linkStateRepository.findById(id)).toBeUndefined();
    expect(insert).not.toHaveBeenCalled();
  });

  it("로그 기록이 실패해도 상태는 바뀐다", async () => {
    insert.mockRejectedValue(new Error("db down"));

    await provider.markDown(id, "A", "close");

    expect(await findStatus()).toBe("DOWN");
  });
});
