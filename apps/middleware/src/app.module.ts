import { Module } from "@nestjs/common";
import { ConnectionModule } from "./connection/connection.module";
import { DeviceModule } from "./device/device.module";
import { HealthModule } from "./health/health.module";
import { IngestModule } from "./ingest/ingest.module";
import { LogModule } from "./log/log.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    IngestModule,
    DeviceModule,
    LogModule,
    ConnectionModule,
  ],
})
export class AppModule {}
