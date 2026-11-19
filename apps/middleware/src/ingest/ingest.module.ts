import { Module } from "@nestjs/common";
import { HistoryModule } from "../history/history.module";
import { StateModule } from "../state/state.module";
import { VendorAAdapter } from "./adapters/vendor-a.adapter";
import { VENDOR_ADAPTERS } from "./adapters/vendor-adapter";
import { IngestService } from "./ingest.service";
import { ConnectionProvider } from "./providers/connection.provider";
import { MqttLinkProvider } from "./providers/mqtt-link.provider";
import { RobotStateProvider } from "./providers/robot-state.provider";
import { SeqJudgeProvider } from "./providers/seq-judge.provider";
import { TelemetryProvider } from "./providers/telemetry.provider";
import { MqttClientRepository } from "./repositories/mqtt-client.repository";
import { VendorsConnectionsRepository } from "./repositories/vendors-connections.repository";

@Module({
  imports: [StateModule, HistoryModule],
  providers: [
    IngestService,
    ConnectionProvider,
    MqttLinkProvider,
    RobotStateProvider,
    SeqJudgeProvider,
    TelemetryProvider,
    VendorAAdapter,
    {
      provide: VENDOR_ADAPTERS,
      useFactory: (vendorA: VendorAAdapter) => [vendorA],
      inject: [VendorAAdapter],
    },
    MqttClientRepository,
    VendorsConnectionsRepository,
  ],
})
export class IngestModule {}
