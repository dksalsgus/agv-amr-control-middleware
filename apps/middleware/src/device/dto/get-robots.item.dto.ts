import { GetRobotsStateDto } from "./get-robots.state.dto";

export class GetRobotsItemDto {
  id!: string;
  connectionId!: string;
  externalId!: string;
  name!: string;
  type!: string;
  rev!: number;
  stale!: boolean;
  state!: GetRobotsStateDto | null;
}
