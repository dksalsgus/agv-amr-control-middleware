import { Module } from "@nestjs/common";
import { UsersRepository } from "./users.repository";
import { VendorsConnectionsRepository } from "./vendors-connections.repository";
import { VendorsRepository } from "./vendors.repository";

@Module({
  providers: [VendorsRepository, VendorsConnectionsRepository, UsersRepository],
  exports: [VendorsRepository, VendorsConnectionsRepository, UsersRepository],
})
export class SettingsModule {}
