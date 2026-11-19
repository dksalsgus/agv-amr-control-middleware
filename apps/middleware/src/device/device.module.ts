import { Module } from "@nestjs/common";
import { StateModule } from "../state/state.module";
import { RobotsController } from "./robots.controller";
import { RobotsProvider } from "./robots.provider";
import { RobotsService } from "./robots.service";

@Module({
  imports: [StateModule],
  controllers: [RobotsController],
  providers: [RobotsService, RobotsProvider],
})
export class DeviceModule {}
