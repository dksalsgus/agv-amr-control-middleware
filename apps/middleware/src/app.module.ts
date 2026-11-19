import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { appConfig } from "./config/app.config";
import { databaseConfig } from "./config/database.config";
import { ingestConfig } from "./config/ingest.config";
import { linkConfig } from "./config/link.config";
import { staleConfig } from "./config/stale.config";
import { ConnectionModule } from "./connection/connection.module";
import { DeviceModule } from "./device/device.module";
import { HealthModule } from "./health/health.module";
import { IngestModule } from "./ingest/ingest.module";
import { LogModule } from "./log/log.module";
import { LoggerModule } from "./logger/logger.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RealtimeModule } from "./realtime/realtime.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, ingestConfig, linkConfig, staleConfig],
    }),
    ScheduleModule.forRoot(),
    LoggerModule,
    PrismaModule,
    HealthModule,
    IngestModule,
    DeviceModule,
    LogModule,
    ConnectionModule,
    RealtimeModule,
  ],
})
export class AppModule {}
