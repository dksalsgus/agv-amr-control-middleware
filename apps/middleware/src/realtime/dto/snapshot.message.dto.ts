import { RealtimeAlarmDto } from "./realtime-alarm.dto";
import { RealtimeLinkDto } from "./realtime-link.dto";
import { RealtimePlcPointDto } from "./realtime-plc-point.dto";
import { RealtimeRobotDto } from "./realtime-robot.dto";

export class SnapshotMessageDto {
  epoch!: string;
  rev!: number;
  robots!: RealtimeRobotDto[];
  plcPoints!: RealtimePlcPointDto[];
  links!: RealtimeLinkDto[];
  alarms!: RealtimeAlarmDto[];
}
