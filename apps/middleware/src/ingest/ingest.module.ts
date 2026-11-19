import { Module } from "@nestjs/common";
import { HistoryModule } from "../history/history.module";
import { StateModule } from "../state/state.module";
import { VendorAAdapter } from "./adapters/vendor-a.adapter";
import { VendorBAdapter } from "./adapters/vendor-b.adapter";
import { VENDOR_ADAPTERS, VendorAdapter } from "./adapters/vendor-adapter";
import { IngestScheduler } from "./ingest.scheduler";
import { IngestService } from "./ingest.service";
import { ConnectionProvider } from "./providers/connection.provider";
import { MqttLinkProvider } from "./providers/mqtt-link.provider";
import { RestLinkProvider } from "./providers/rest-link.provider";
import { RobotStateProvider } from "./providers/robot-state.provider";
import { SeqJudgeProvider } from "./providers/seq-judge.provider";
import { TelemetryProvider } from "./providers/telemetry.provider";
import { MqttClientRepository } from "./repositories/mqtt-client.repository";
import { RestClientRepository } from "./repositories/rest-client.repository";
import { VendorsConnectionsRepository } from "./repositories/vendors-connections.repository";

@Module({
  imports: [StateModule, HistoryModule],
  providers: [
    IngestScheduler,
    IngestService,
    ConnectionProvider,
    MqttLinkProvider,
    RestLinkProvider,
    RobotStateProvider,
    SeqJudgeProvider,
    TelemetryProvider,
    VendorAAdapter,
    VendorBAdapter,
    {
      provide: VENDOR_ADAPTERS,
      useFactory: (...adapters: VendorAdapter<unknown>[]) => adapters,
      inject: [VendorAAdapter, VendorBAdapter],
    },
    MqttClientRepository,
    RestClientRepository,
    VendorsConnectionsRepository,
  ],
})
export class IngestModule {}
