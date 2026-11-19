import { RealtimeRobotStateDto } from "./realtime-robot-state.dto";

export class RealtimeRobotDto {
  id!: string;
  connectionId!: string;
  externalId!: string;
  name!: string;
  type!: string;
  rev!: number;
  stale!: boolean;
  state!: RealtimeRobotStateDto | null;
}
