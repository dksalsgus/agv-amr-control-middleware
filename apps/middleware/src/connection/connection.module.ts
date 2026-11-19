import { Module } from "@nestjs/common";
import { HistoryModule } from "../history/history.module";
import { IngestModule } from "../ingest/ingest.module";
import { SettingsModule } from "../settings/settings.module";
import { StateModule } from "../state/state.module";
import { ConnectionsController } from "./connections.controller";
import { ConnectionsProvider } from "./connections.provider";
import { ConnectionsService } from "./connections.service";
import { VendorsController } from "./vendors.controller";
import { VendorsProvider } from "./vendors.provider";
import { VendorsService } from "./vendors.service";

@Module({
  imports: [HistoryModule, IngestModule, SettingsModule, StateModule],
  controllers: [ConnectionsController, VendorsController],
  providers: [
    ConnectionsService,
    ConnectionsProvider,
    VendorsService,
    VendorsProvider,
  ],
})
export class ConnectionModule {}
