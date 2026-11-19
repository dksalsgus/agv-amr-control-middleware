import { Injectable } from "@nestjs/common";
import { LinkStatus } from "../state/link-state";
import { LinkStateRepository } from "../state/link-state.repository";
import { PlcDeviceLastRead, PlcPointEntry } from "../state/plc-point-state";
import { PlcPointStateRepository } from "../state/plc-point-state.repository";

@Injectable()
export class PlcPointsProvider {
  constructor(
    private readonly plcPointStateRepository: PlcPointStateRepository,
    private readonly linkStateRepository: LinkStateRepository,
  ) {}

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
