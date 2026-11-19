import { Module } from "@nestjs/common";
import { HistoryModule } from "../history/history.module";
import { HistoryCleanupProvider } from "./providers/history-cleanup.provider";
import { RetentionScheduler } from "./retention.scheduler";
import { RetentionService } from "./retention.service";

@Module({
  imports: [HistoryModule],
  providers: [RetentionScheduler, RetentionService, HistoryCleanupProvider],
})
export class RetentionModule {}
