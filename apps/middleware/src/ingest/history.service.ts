import { Injectable } from "@nestjs/common";
import { HistoryJobData } from "./history-queue.types";
import { PlcEventProvider } from "./providers/plc-event.provider";
import { TelemetryProvider } from "./providers/telemetry.provider";

@Injectable()
export class HistoryService {
  constructor(
    private readonly telemetryProvider: TelemetryProvider,
    private readonly plcEventProvider: PlcEventProvider,
  ) {}

  async save(data: HistoryJobData): Promise<void> {
    if (data.kind === "TELEMETRY") {
      await this.telemetryProvider.saveAll(data.rows);
      return;
    }

    await this.plcEventProvider.saveAll(data.rows);
  }
}
