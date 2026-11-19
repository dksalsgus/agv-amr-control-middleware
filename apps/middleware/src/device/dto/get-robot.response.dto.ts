import { GetRobotStateDto } from "./get-robot.state.dto";

export class GetRobotResponseDto {
  id!: string;
  connectionId!: string;
  externalId!: string;
  name!: string;
  type!: string;
  rev!: number;
  stale!: boolean;
  state!: GetRobotStateDto | null;
}
