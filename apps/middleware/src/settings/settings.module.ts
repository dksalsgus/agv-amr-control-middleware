import { Module } from "@nestjs/common";
import { VendorsConnectionsRepository } from "./vendors-connections.repository";
import { VendorsRepository } from "./vendors.repository";

/** 설정 테이블 Repository 모음 */
@Module({
  providers: [VendorsRepository, VendorsConnectionsRepository],
  exports: [VendorsRepository, VendorsConnectionsRepository],
})
export class SettingsModule {}
