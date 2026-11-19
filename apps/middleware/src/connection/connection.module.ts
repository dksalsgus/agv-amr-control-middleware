import { Module } from "@nestjs/common";
import { SettingsModule } from "../settings/settings.module";
import { StateModule } from "../state/state.module";
import { ConnectionsController } from "./connections.controller";
import { ConnectionsProvider } from "./connections.provider";
import { ConnectionsService } from "./connections.service";
import { VendorsController } from "./vendors.controller";
import { VendorsProvider } from "./vendors.provider";
import { VendorsService } from "./vendors.service";

@Module({
  imports: [SettingsModule, StateModule],
  controllers: [ConnectionsController, VendorsController],
  providers: [
    ConnectionsService,
    ConnectionsProvider,
    VendorsService,
    VendorsProvider,
  ],
})
export class ConnectionModule {}
