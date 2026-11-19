import { Module } from "@nestjs/common";
import { RolesUsersRepository } from "./roles-users.repository";
import { VendorsConnectionsRepository } from "./vendors-connections.repository";
import { VendorsRepository } from "./vendors.repository";

@Module({
  providers: [
    VendorsRepository,
    VendorsConnectionsRepository,
    RolesUsersRepository,
  ],
  exports: [
    VendorsRepository,
    VendorsConnectionsRepository,
    RolesUsersRepository,
  ],
})
export class SettingsModule {}
