import { Module } from "@nestjs/common";
import { HistoryModule } from "../history/history.module";
import { SettingsModule } from "../settings/settings.module";
import { StateModule } from "../state/state.module";
import { PlcAdapter } from "./adapters/plc.adapter";
import { VendorAAdapter } from "./adapters/vendor-a.adapter";
import { VendorBAdapter } from "./adapters/vendor-b.adapter";
import { VendorCAdapter } from "./adapters/vendor-c.adapter";
import { VENDOR_ADAPTERS, VendorAdapter } from "./adapters/vendor-adapter";
import { HistoryProcessor } from "./history.processor";
import { HistoryService } from "./history.service";
import { IngestScheduler } from "./ingest.scheduler";
import { IngestService } from "./ingest.service";
import { PlcIngestService } from "./plc-ingest.service";
import { ConnectionProvider } from "./providers/connection.provider";
import { LinkStateProvider } from "./providers/link-state.provider";
import { ModbusLinkProvider } from "./providers/modbus-link.provider";
import { MqttLinkProvider } from "./providers/mqtt-link.provider";
import { PlcEventProvider } from "./providers/plc-event.provider";
import { PlcPointStateProvider } from "./providers/plc-point-state.provider";
import { RestLinkProvider } from "./providers/rest-link.provider";
import { RobotStateProvider } from "./providers/robot-state.provider";
import { SeqJudgeProvider } from "./providers/seq-judge.provider";
import { TelemetryProvider } from "./providers/telemetry.provider";
import { ModbusClientRepository } from "./repositories/modbus-client.repository";
import { MqttClientRepository } from "./repositories/mqtt-client.repository";
import { RestClientRepository } from "./repositories/rest-client.repository";

@Module({
  imports: [StateModule, HistoryModule, SettingsModule],
  providers: [
    IngestScheduler,
    IngestService,
    PlcIngestService,
    HistoryProcessor,
    HistoryService,
    ConnectionProvider,
    LinkStateProvider,
    ModbusLinkProvider,
    MqttLinkProvider,
    PlcEventProvider,
    PlcPointStateProvider,
    RestLinkProvider,
    RobotStateProvider,
    SeqJudgeProvider,
    TelemetryProvider,
    PlcAdapter,
    VendorAAdapter,
    VendorBAdapter,
    VendorCAdapter,
    {
      provide: VENDOR_ADAPTERS,
      useFactory: (
        vendorA: VendorAAdapter,
        vendorB: VendorBAdapter,
        vendorC: VendorCAdapter,
      ): VendorAdapter<unknown>[] => [vendorA, vendorB, vendorC],
      inject: [VendorAAdapter, VendorBAdapter, VendorCAdapter],
    },
    ModbusClientRepository,
    MqttClientRepository,
    RestClientRepository,
  ],
})
export class IngestModule {}
