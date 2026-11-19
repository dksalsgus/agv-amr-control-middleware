import { RealtimeAlarmDto } from "./realtime-alarm.dto";
import { RealtimeLinkDto } from "./realtime-link.dto";
import { RealtimePlcPointDto } from "./realtime-plc-point.dto";
import { RealtimeRemovedDto } from "./realtime-removed.dto";
import { RealtimeRobotDto } from "./realtime-robot.dto";

/** fromRev 다음부터 rev까지 바뀐 엔티티 */
export class DeltaMessageDto {
  fromRev!: number;
  rev!: number;
  robots!: RealtimeRobotDto[];
  plcPoints!: RealtimePlcPointDto[];
  links!: RealtimeLinkDto[];
  alarms!: RealtimeAlarmDto[];
  removed!: RealtimeRemovedDto[];
}
