import { Injectable } from "@nestjs/common";
import { PlcPointEntry } from "../state/plc-point-state";
import { PlcPointStateRepository } from "../state/plc-point-state.repository";

@Injectable()
export class PlcPointsProvider {
  constructor(
    private readonly plcPointStateRepository: PlcPointStateRepository,
  ) {}

  findAll(): PlcPointEntry[] {
    return this.plcPointStateRepository.findAll();
  }

  findById(pointId: string): PlcPointEntry | undefined {
    return this.plcPointStateRepository.findById(pointId);
  }
}
