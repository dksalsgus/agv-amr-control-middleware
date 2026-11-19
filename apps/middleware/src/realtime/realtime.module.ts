import { Module } from "@nestjs/common";
import { DeviceModule } from "../device/device.module";
import { StateModule } from "../state/state.module";
import { RealtimeStateProvider } from "./realtime-state.provider";
import { RealtimeGateway } from "./realtime.gateway";
import { RealtimeService } from "./realtime.service";

@Module({
  imports: [StateModule, DeviceModule],
  providers: [RealtimeGateway, RealtimeService, RealtimeStateProvider],
})
export class RealtimeModule {}
