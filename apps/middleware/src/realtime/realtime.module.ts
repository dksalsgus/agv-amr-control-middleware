import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DeviceModule } from "../device/device.module";
import { StateModule } from "../state/state.module";
import { RealtimeStateProvider } from "./realtime-state.provider";
import { RealtimeGateway } from "./realtime.gateway";
import { RealtimeService } from "./realtime.service";

@Module({
  imports: [StateModule, DeviceModule, AuthModule],
  providers: [RealtimeGateway, RealtimeService, RealtimeStateProvider],
})
export class RealtimeModule {}
