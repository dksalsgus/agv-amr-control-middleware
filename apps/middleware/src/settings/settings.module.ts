import { Module } from "@nestjs/common";
import { VendorsConnectionsRepository } from "./vendors-connections.repository";
import { VendorsRepository } from "./vendors.repository";

@Module({
  providers: [VendorsRepository, VendorsConnectionsRepository],
  exports: [VendorsRepository, VendorsConnectionsRepository],
})
export class SettingsModule {}
