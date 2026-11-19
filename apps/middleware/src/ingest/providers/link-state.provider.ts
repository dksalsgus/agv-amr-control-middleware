import { Injectable, Inject } from "@nestjs/common";
import { LogsRepository } from "../../history/logs.repository";
import { LogLevel, LogType } from "../../log/log";
import { LinkState, LinkStatus } from "../../state/link-state";
import { LinkStateRepository } from "../../state/link-state.repository";
import { RemovedEntityRepository } from "../../state/removed-entity.repository";
import { RevisionRepository } from "../../state/revision.repository";
import { AppLogger } from "../../logger/app-logger";
import { linkConfig } from "../../config/link.config";
import { ConfigType } from "@nestjs/config";

/** 연결 UP/DOWN 판정. 상태가 바뀔 때만 logs에 남긴다. */
@Injectable()
export class LinkStateProvider {
  constructor(
    @Inject(linkConfig.KEY)
    private readonly config: ConfigType<typeof linkConfig>,
    private readonly linkStateRepository: LinkStateRepository,
    private readonly logsRepository: LogsRepository,
    private readonly revisionRepository: RevisionRepository,
    private readonly removedEntityRepository: RemovedEntityRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LinkStateProvider.name);
  }

  async register(connectionId: string): Promise<void> {
    await this.linkStateRepository.save(connectionId, {
      status: "UNKNOWN",
      changedAt: null,
      failureCount: 0,
      rev: await this.revisionRepository.next(),
    });
    await this.removedEntityRepository.remove("LINK", connectionId);
  }

  async unregister(connectionId: string): Promise<void> {
    await this.linkStateRepository.remove(connectionId);
    await this.removedEntityRepository.save({
      kind: "LINK",
      id: connectionId,
      rev: await this.revisionRepository.next(),
    });
  }

  async markUp(connectionId: string, label: string): Promise<void> {
    const state = await this.findState(connectionId);
    if (state.status === "UP") {
      await this.linkStateRepository.save(connectionId, {
        status: state.status,
        changedAt: state.changedAt,
        failureCount: 0,
        rev: state.rev,
      });
      return;
    }

    await this.change(connectionId, "UP", 0);
    await this.writeLog(connectionId, "LINK_UP", "INFO", `${label} 연결됨`);
  }

  /** 폴링 실패 한 번. 연속 실패가 기준에 닿으면 DOWN으로 바꾼다. */
  async markFailure(
    connectionId: string,
    label: string,
    reason: string,
  ): Promise<void> {
    const state = await this.findState(connectionId);
    const failureCount = state.failureCount + 1;

    if (
      state.status === "DOWN" ||
      failureCount < this.config.downAfterFailures
    ) {
      await this.linkStateRepository.save(connectionId, {
        status: state.status,
        changedAt: state.changedAt,
        failureCount,
        rev: state.rev,
      });
      return;
    }

    await this.change(connectionId, "DOWN", failureCount);
    await this.writeDownLog(connectionId, label, reason);
  }

  /** MQTT처럼 끊김 이벤트가 있는 연결은 바로 DOWN으로 바꾼다. */
  async markDown(
    connectionId: string,
    label: string,
    reason: string,
  ): Promise<void> {
    const state = await this.findState(connectionId);
    if (state.status === "DOWN") {
      return;
    }

    await this.change(connectionId, "DOWN", state.failureCount);
    await this.writeDownLog(connectionId, label, reason);
  }

  /** DOWN이면 다음 재시도까지 기다릴 ms(1초부터 두 배씩, 최대 10초). 아니면 null */
  async findRetryDelayMs(connectionId: string): Promise<number | null> {
    const state = await this.findState(connectionId);
    if (state.status !== "DOWN") {
      return null;
    }

    const retries = Math.max(
      0,
      state.failureCount - this.config.downAfterFailures,
    );
    return Math.min(
      this.config.minRetryMs * 2 ** retries,
      this.config.maxRetryMs,
    );
  }

  private async findState(connectionId: string): Promise<LinkState> {
    const state = await this.linkStateRepository.findById(connectionId);
    return (
      state ?? { status: "UNKNOWN", changedAt: null, failureCount: 0, rev: 0 }
    );
  }

  private async change(
    connectionId: string,
    status: LinkStatus,
    failureCount: number,
  ): Promise<void> {
    await this.linkStateRepository.save(connectionId, {
      status,
      changedAt: new Date(),
      failureCount,
      rev: await this.revisionRepository.next(),
    });
  }

  private async writeDownLog(
    connectionId: string,
    label: string,
    reason: string,
  ): Promise<void> {
    await this.writeLog(
      connectionId,
      "LINK_DOWN",
      "CRITICAL",
      `${label} 연결 끊김: ${reason}`,
    );
  }

  /** 로그 기록 실패는 수집을 멈추지 않도록 서버 로그만 남긴다. */
  private async writeLog(
    connectionId: string,
    type: LogType,
    level: LogLevel,
    message: string,
  ): Promise<void> {
    this.logger.log(message);

    try {
      await this.logsRepository.insert({
        type,
        level,
        target_type: "CONNECTION",
        target_id: connectionId,
        message,
      });
    } catch (error) {
      this.logger.warn(`로그 기록 실패: ${String(error)}`);
    }
  }
}
