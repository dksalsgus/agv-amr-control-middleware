import { Module } from "@nestjs/common";
import { StateModule } from "../state/state.module";
import { MetricsController } from "./metrics.controller";
import { MetricsScheduler } from "./metrics.scheduler";
import { MetricsService } from "./metrics.service";
import { ConnectionStatsProvider } from "./providers/connection-stats.provider";
import { IngestMetricsQueryProvider } from "./providers/ingest-metrics-query.provider";
import { ProcessMetricsProvider } from "./providers/process-metrics.provider";

@Module({
  imports: [StateModule],
  controllers: [MetricsController],
  providers: [
    MetricsScheduler,
    MetricsService,
    IngestMetricsQueryProvider,
    ConnectionStatsProvider,
    ProcessMetricsProvider,
  ],
})
export class MetricsModule {}
