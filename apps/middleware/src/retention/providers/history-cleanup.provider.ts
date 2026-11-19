import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { retentionConfig } from "../../config/retention.config";
import { LogsRepository } from "../../history/logs.repository";
import { VendorsConnectionsDevicesPlcPointsEventsRepository } from "../../history/vendors-connections-devices-plc-points-events.repository";
import { VendorsConnectionsDevicesTelemetryRepository } from "../../history/vendors-connections-devices-telemetry.repository";
import { DeleteBatch } from "../retention.types";

/** 이력 테이블에서 cutoff보다 오래된 행을 묶음 단위로 모두 지운다. */
@Injectable()
export class HistoryCleanupProvider {
  constructor(
    @Inject(retentionConfig.KEY)
    private readonly config: ConfigType<typeof retentionConfig>,
    private readonly telemetryRepository: VendorsConnectionsDevicesTelemetryRepository,
    private readonly plcEventsRepository: VendorsConnectionsDevicesPlcPointsEventsRepository,
    private readonly logsRepository: LogsRepository,
  ) {}

  async deleteTelemetry(cutoff: Date): Promise<number> {
    return await this.deleteAll(
      (before, size) => this.telemetryRepository.deleteOlderThan(before, size),
      cutoff,
      0,
    );
  }

  async deletePlcEvents(cutoff: Date): Promise<number> {
    return await this.deleteAll(
      (before, size) => this.plcEventsRepository.deleteOlderThan(before, size),
      cutoff,
      0,
    );
  }

  async deleteLogs(cutoff: Date): Promise<number> {
    return await this.deleteAll(
      (before, size) => this.logsRepository.deleteOlderThan(before, size),
      cutoff,
      0,
    );
  }

  /** 한 묶음씩 지우고, 묶음보다 적게 지워지면 끝낸다. */
  private async deleteAll(
    deleteBatch: DeleteBatch,
    cutoff: Date,
    deletedSoFar: number,
  ): Promise<number> {
    const batchSize = this.config.deleteBatchSize;
    const deleted = await deleteBatch(cutoff, batchSize);
    const total = deletedSoFar + deleted;
    if (deleted < batchSize) {
      return total;
    }

    return await this.deleteAll(deleteBatch, cutoff, total);
  }
}
