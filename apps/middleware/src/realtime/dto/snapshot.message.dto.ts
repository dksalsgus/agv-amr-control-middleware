import { RealtimeLinkDto } from "./realtime-link.dto";
import { RealtimePlcPointDto } from "./realtime-plc-point.dto";
import { RealtimeRobotDto } from "./realtime-robot.dto";

export class SnapshotMessageDto {
  epoch!: string;
  rev!: number;
  robots!: RealtimeRobotDto[];
  plcPoints!: RealtimePlcPointDto[];
  links!: RealtimeLinkDto[];
  /** 조각 10(알람)에서 채운다. */
  alarms!: [];
}
