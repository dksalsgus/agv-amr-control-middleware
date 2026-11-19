import { Module } from "@nestjs/common";
import { HistoryModule } from "../history/history.module";
import { LogsController } from "./logs.controller";
import { LogsQueryProvider } from "./logs-query.provider";
import { LogsService } from "./logs.service";

@Module({
  imports: [HistoryModule],
  controllers: [LogsController],
  providers: [LogsService, LogsQueryProvider],
})
export class LogModule {}
