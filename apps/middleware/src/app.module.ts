import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { IngestModule } from "./ingest/ingest.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [PrismaModule, HealthModule, IngestModule],
})
export class AppModule {}
