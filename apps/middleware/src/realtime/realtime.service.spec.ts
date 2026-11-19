import { staleConfig } from "../config/stale.config";
import { StaleJudgeProvider } from "../device/stale-judge.provider";
import { AlarmStateRepository } from "../state/alarm-state.repository";
import { LinkStateRepository } from "../state/link-state.repository";
import { PlcPointStateRepository } from "../state/plc-point-state.repository";
import { RemovedEntityRepository } from "../state/removed-entity.repository";
import { RevisionRepository } from "../state/revision.repository";
import { RobotStateRepository } from "../state/robot-state.repository";
import { RealtimeStateProvider } from "./realtime-state.provider";
import { RealtimeService } from "./realtime.service";

const robot = (deviceId: string) => ({
  deviceId,
  connectionId: "conn-1",
  externalId: deviceId,
  name: deviceId,
  type: "AMR" as const,
});

describe("RealtimeService", () => {
  const setup = async () => {
    const revisionRepository = new RevisionRepository();
    const robotStateRepository = new RobotStateRepository();
    const removedEntityRepository = new RemovedEntityRepository();
    const alarmStateRepository = new AlarmStateRepository();
    const service = new RealtimeService(
      new RealtimeStateProvider(
        revisionRepository,
        robotStateRepository,
        new PlcPointStateRepository(),
        new LinkStateRepository(),
        removedEntityRepository,
        alarmStateRepository,
      ),
      new StaleJudgeProvider(staleConfig()),
    );

    await robotStateRepository.register(
      robot("r1"),
      await revisionRepository.next(),
    );
    await robotStateRepository.register(
      robot("r2"),
      await revisionRepository.next(),
    );

    return {
      service,
      revisionRepository,
      robotStateRepository,
      removedEntityRepository,
      alarmStateRepository,
    };
  };

  it("처음 접속(epoch 없음)이면 전체 snapshot을 준다", async () => {
    const { service } = await setup();

    const reply = await service.hello({});

    expect(reply.event).toBe("snapshot");
    expect(reply.data.rev).toBe(2);
    expect(reply.event === "snapshot" && reply.data.robots).toHaveLength(2);
  });

  it("같은 epoch로 이어받으면 lastRev 뒤에 바뀐 것과 지운 것만 delta로 준다", async () => {
    const { service, revisionRepository, robotStateRepository } = await setup();
    const { epoch } = await service.getSnapshot();

    await robotStateRepository.register(
      robot("r3"),
      await revisionRepository.next(),
    );

    const reply = await service.hello({ epoch, lastRev: 2 });

    expect(reply.event).toBe("delta");
    expect(reply.data).toMatchObject({ fromRev: 2, rev: 3 });
    expect(
      reply.event === "delta" && reply.data.robots.map((item) => item.id),
    ).toEqual(["r3"]);
  });

  it("다른 epoch거나 서버보다 앞선 rev면 snapshot을 준다", async () => {
    const { service } = await setup();

    expect((await service.hello({ epoch: "old", lastRev: 1 })).event).toBe(
      "snapshot",
    );
    expect((await service.resync(99)).event).toBe("snapshot");
  });

  it("delta의 removed에 지운 엔티티가 실리고, 바뀐 것이 없으면 null", async () => {
    const { service, revisionRepository, removedEntityRepository } =
      await setup();

    expect(await service.getDelta(2)).toBeNull();

    await removedEntityRepository.save({
      kind: "ROBOT",
      id: "r1",
      rev: await revisionRepository.next(),
    });

    expect((await service.getDelta(2))?.removed).toEqual([
      { kind: "ROBOT", id: "r1" },
    ]);
  });

  it("열리거나 확인된 알람은 rev가 오르면 snapshot과 delta에 실린다", async () => {
    const { service, revisionRepository, alarmStateRepository } = await setup();

    await alarmStateRepository.save({
      id: "a1",
      code: "ROBOT_ERROR",
      level: "CRITICAL",
      targetType: "DEVICE",
      targetId: "r1",
      message: "r1 오류",
      raisedAt: new Date(0),
      ackedAt: null,
      rev: await revisionRepository.next(),
    });

    expect((await service.getSnapshot()).alarms).toHaveLength(1);
    expect((await service.getDelta(2))?.alarms.map((item) => item.id)).toEqual([
      "a1",
    ]);
    expect(await service.getDelta(3)).toBeNull();
  });
});
