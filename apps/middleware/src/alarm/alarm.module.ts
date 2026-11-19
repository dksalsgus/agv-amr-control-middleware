import { Module } from "@nestjs/common";
import { DeviceModule } from "../device/device.module";
import { HistoryModule } from "../history/history.module";
import { StateModule } from "../state/state.module";
import { AlarmScheduler } from "./alarm.scheduler";
import { AlarmService } from "./alarm.service";
import { AlarmJudgeProvider } from "./providers/alarm-judge.provider";
import { AlarmStateProvider } from "./providers/alarm-state.provider";
import { AlarmTargetProvider } from "./providers/alarm-target.provider";

@Module({
  imports: [StateModule, HistoryModule, DeviceModule],
  providers: [
    AlarmScheduler,
    AlarmService,
    AlarmJudgeProvider,
    AlarmStateProvider,
    AlarmTargetProvider,
  ],
})
export class AlarmModule {}
