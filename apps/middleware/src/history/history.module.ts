import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { queueConfig } from "../config/queue.config";
import { HISTORY_QUEUE } from "./history-queue.constants";
import { HistoryQueueRepository } from "./history-queue.repository";
import { LogsRepository } from "./logs.repository";
import { VendorsConnectionsDevicesPlcPointsEventsRepository } from "./vendors-connections-devices-plc-points-events.repository";
import { VendorsConnectionsDevicesTelemetryRepository } from "./vendors-connections-devices-telemetry.repository";

@Module({
  imports: [
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
    HistoryQueueRepository,
    VendorsConnectionsDevicesTelemetryRepository,
    VendorsConnectionsDevicesPlcPointsEventsRepository,
    LogsRepository,
  ],
  exports: [
    HistoryQueueRepository,
    VendorsConnectionsDevicesTelemetryRepository,
    VendorsConnectionsDevicesPlcPointsEventsRepository,
    LogsRepository,
  ],
})
export class HistoryModule {}
