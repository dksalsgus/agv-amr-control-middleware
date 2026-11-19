import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { queueConfig } from "../config/queue.config";
import { HistoryModule } from "../history/history.module";
import { SettingsModule } from "../settings/settings.module";
import { StateModule } from "../state/state.module";
import { PlcAdapter } from "./adapters/plc.adapter";
import { VendorAAdapter } from "./adapters/vendor-a.adapter";
import { VendorBAdapter } from "./adapters/vendor-b.adapter";
import { VendorCAdapter } from "./adapters/vendor-c.adapter";
import { VENDOR_ADAPTERS, VendorAdapter } from "./adapters/vendor-adapter";
import { HISTORY_QUEUE } from "./history-queue.constants";
import { HistoryProcessor } from "./history.processor";
import { HistoryService } from "./history.service";
import { IngestScheduler } from "./ingest.scheduler";
import { IngestService } from "./ingest.service";
import { PlcIngestService } from "./plc-ingest.service";
import { IngestConnectionProvider } from "./providers/ingest-connection.provider";
import { DeviceTransportProvider } from "./providers/device-transport.provider";
import { HistoryQueueProvider } from "./providers/history-queue.provider";
import { IngestMetricsProvider } from "./providers/ingest-metrics.provider";
import { LinkStateProvider } from "./providers/link-state.provider";
import { PlcEventProvider } from "./providers/plc-event.provider";
import { PlcPointStateProvider } from "./providers/plc-point-state.provider";
import { RobotStateProvider } from "./providers/robot-state.provider";
import { TelemetryProvider } from "./providers/telemetry.provider";
import { ModbusClientRepository } from "./repositories/modbus-client.repository";
import { MqttClientRepository } from "./repositories/mqtt-client.repository";
import { RestClientRepository } from "./repositories/rest-client.repository";

@Module({
  imports: [
    StateModule,
    HistoryModule,
    SettingsModule,
    BullModule.registerQueueAsync({
      name: HISTORY_QUEUE,
      inject: [queueConfig.KEY],
      // Redis가 끊기면 넣기를 기다리지 않고 바로 실패시켜 수집이 멈추지 않게 한다.
      useFactory: (config: ConfigType<typeof queueConfig>) => ({
        connection: {
          host: config.redisHost,
          port: config.redisPort,
          enableOfflineQueue: false,
        },
      }),
    }),
  ],
  providers: [
    IngestScheduler,
    IngestService,
    PlcIngestService,
    HistoryProcessor,
    HistoryService,
    HistoryQueueProvider,
    IngestMetricsProvider,
    IngestConnectionProvider,
    DeviceTransportProvider,
    LinkStateProvider,
    PlcEventProvider,
    PlcPointStateProvider,
    RobotStateProvider,
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
