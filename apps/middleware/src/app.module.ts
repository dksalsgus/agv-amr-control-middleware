import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { AlarmModule } from "./alarm/alarm.module";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { alarmConfig } from "./config/alarm.config";
import { appConfig } from "./config/app.config";
import { authConfig } from "./config/auth.config";
import { databaseConfig } from "./config/database.config";
import { ingestConfig } from "./config/ingest.config";
import { linkConfig } from "./config/link.config";
import { linkQualityConfig } from "./config/link-quality.config";
import { queueConfig } from "./config/queue.config";
import { realtimeConfig } from "./config/realtime.config";
import { retentionConfig } from "./config/retention.config";
import { staleConfig } from "./config/stale.config";
import { ConnectionModule } from "./connection/connection.module";
import { DeviceModule } from "./device/device.module";
import { HealthModule } from "./health/health.module";
import { IngestModule } from "./ingest/ingest.module";
import { LogModule } from "./log/log.module";
import { MetricsModule } from "./metrics/metrics.module";
import { LoggerModule } from "./logger/logger.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RetentionModule } from "./retention/retention.module";
import { RealtimeModule } from "./realtime/realtime.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        ingestConfig,
        linkConfig,
        linkQualityConfig,
        staleConfig,
        realtimeConfig,
        alarmConfig,
        authConfig,
        queueConfig,
        retentionConfig,
      ],
    }),
    BullModule.forRootAsync({
      inject: [queueConfig.KEY],
      useFactory: (config: ConfigType<typeof queueConfig>) => ({
        connection: { host: config.redisHost, port: config.redisPort },
      }),
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
    AlarmModule,
    AuthModule,
    MetricsModule,
    RetentionModule,
  ],
})
export class AppModule {}
