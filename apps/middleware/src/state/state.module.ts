import { Module } from "@nestjs/common";
import { LinkStateRepository } from "./link-state.repository";
import { PlcPointStateRepository } from "./plc-point-state.repository";
import { RemovedEntityRepository } from "./removed-entity.repository";
import { RevisionRepository } from "./revision.repository";
import { RobotStateRepository } from "./robot-state.repository";

@Module({
  providers: [
    RobotStateRepository,
    PlcPointStateRepository,
    RevisionRepository,
    LinkStateRepository,
    RemovedEntityRepository,
  ],
  exports: [
    RobotStateRepository,
    PlcPointStateRepository,
    RevisionRepository,
    LinkStateRepository,
    RemovedEntityRepository,
  ],
})
export class StateModule {}
