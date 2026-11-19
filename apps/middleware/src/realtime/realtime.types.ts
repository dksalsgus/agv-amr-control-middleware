import { RealtimeLinkDto } from "./dto/realtime-link.dto";
import { RealtimePlcPointDto } from "./dto/realtime-plc-point.dto";
import { RealtimeRobotDto } from "./dto/realtime-robot.dto";
import { DeltaMessageDto } from "./dto/delta.message.dto";
import { SnapshotMessageDto } from "./dto/snapshot.message.dto";

export type RealtimeReply =
  | { event: "snapshot"; data: SnapshotMessageDto }
  | { event: "delta"; data: DeltaMessageDto };

export type ChangedEntities = {
  robots: RealtimeRobotDto[];
  plcPoints: RealtimePlcPointDto[];
  links: RealtimeLinkDto[];
};
