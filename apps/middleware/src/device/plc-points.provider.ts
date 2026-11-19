import { Injectable } from "@nestjs/common";
import { LogsRepository } from "../history/logs.repository";
import { AppLogger } from "../logger/app-logger";
import { LinkStatus } from "../state/link-state";
import { LinkStateRepository } from "../state/link-state.repository";
import { PlcDeviceLastRead, PlcPointEntry } from "../state/plc-point-state";
import { PlcPointStateRepository } from "../state/plc-point-state.repository";

@Injectable()
export class PlcPointsProvider {
  constructor(
    private readonly plcPointStateRepository: PlcPointStateRepository,
    private readonly linkStateRepository: LinkStateRepository,
    private readonly logsRepository: LogsRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(PlcPointsProvider.name);
  }

  /** 누가 어떤 값을 썼는지 PLC 점 이력에 남긴다. 기록 실패로 쓰기를 되돌리지는 않는다. */
  async writeWriteLog(
    pointId: string,
    message: string,
    usersId: string,
  ): Promise<void> {
    this.logger.log(message);

    try {
      await this.logsRepository.insert({
        type: "PLC_WRITE",
        level: "INFO",
        target_type: "PLC_POINT",
        target_id: pointId,
        message,
        users_id: usersId,
      });
    } catch (error) {
      this.logger.warn(`로그 기록 실패: ${String(error)}`);
    }
  }

  async findAll(): Promise<PlcPointEntry[]> {
    return await this.plcPointStateRepository.findAll();
  }

  async findById(pointId: string): Promise<PlcPointEntry | undefined> {
    return await this.plcPointStateRepository.findById(pointId);
  }

  async findLastRead(deviceId: string): Promise<PlcDeviceLastRead | null> {
    return await this.plcPointStateRepository.findLastRead(deviceId);
  }

  async findLinkStatus(connectionId: string): Promise<LinkStatus> {
    const link = await this.linkStateRepository.findById(connectionId);
    return link?.status ?? "UNKNOWN";
  }
}
