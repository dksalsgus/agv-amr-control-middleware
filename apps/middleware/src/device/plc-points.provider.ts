import { Injectable } from "@nestjs/common";
import { PlcPointEntry } from "../state/plc-point-state";
import { PlcPointStateRepository } from "../state/plc-point-state.repository";

@Injectable()
export class PlcPointsProvider {
  constructor(
    private readonly plcPointStateRepository: PlcPointStateRepository,
  ) {}

  async findAll(): Promise<PlcPointEntry[]> {
    return await this.plcPointStateRepository.findAll();
  }

  async findById(pointId: string): Promise<PlcPointEntry | undefined> {
    return await this.plcPointStateRepository.findById(pointId);
  }
}
