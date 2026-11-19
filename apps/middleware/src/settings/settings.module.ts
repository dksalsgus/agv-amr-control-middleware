import { Module } from "@nestjs/common";
import { VendorsConnectionsRepository } from "./vendors-connections.repository";

/** 설정 테이블 Repository 모음 */
@Module({
  providers: [VendorsConnectionsRepository],
  exports: [VendorsConnectionsRepository],
})
export class SettingsModule {}
