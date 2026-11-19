import { Module } from "@nestjs/common";
import { HistoryModule } from "../history/history.module";
import { StateModule } from "../state/state.module";
import { RobotTelemetryService } from "./robot-telemetry.service";
import { RobotsController } from "./robots.controller";
import { RobotsProvider } from "./robots.provider";
import { RobotsService } from "./robots.service";
import { TelemetryQueryProvider } from "./telemetry-query.provider";

@Module({
  imports: [StateModule, HistoryModule],
  controllers: [RobotsController],
  providers: [
    RobotsService,
    RobotTelemetryService,
    RobotsProvider,
    TelemetryQueryProvider,
  ],
})
export class DeviceModule {}
