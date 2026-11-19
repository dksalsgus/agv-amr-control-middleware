import { Module } from "@nestjs/common";
import { HistoryModule } from "../history/history.module";
import { IngestModule } from "../ingest/ingest.module";
import { StateModule } from "../state/state.module";
import { PlcEventsQueryProvider } from "./plc-events-query.provider";
import { PlcPointsController } from "./plc-points.controller";
import { PlcPointsProvider } from "./plc-points.provider";
import { PlcPointsService } from "./plc-points.service";
import { RobotTelemetryService } from "./robot-telemetry.service";
import { RobotsController } from "./robots.controller";
import { RobotsProvider } from "./robots.provider";
import { RobotsService } from "./robots.service";
import { TelemetryQueryProvider } from "./telemetry-query.provider";

@Module({
  imports: [StateModule, HistoryModule, IngestModule],
  controllers: [RobotsController, PlcPointsController],
  providers: [
    RobotsService,
    RobotTelemetryService,
    PlcPointsService,
    RobotsProvider,
    TelemetryQueryProvider,
    PlcPointsProvider,
    PlcEventsQueryProvider,
  ],
})
export class DeviceModule {}
