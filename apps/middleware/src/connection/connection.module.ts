import { Module } from "@nestjs/common";
import { SettingsModule } from "../settings/settings.module";
import { StateModule } from "../state/state.module";
import { ConnectionsController } from "./connections.controller";
import { ConnectionsProvider } from "./connections.provider";
import { ConnectionsService } from "./connections.service";

@Module({
  imports: [SettingsModule, StateModule],
  controllers: [ConnectionsController],
  providers: [ConnectionsService, ConnectionsProvider],
})
export class ConnectionModule {}
