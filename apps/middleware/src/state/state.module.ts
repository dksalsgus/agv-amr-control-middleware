import { Module } from "@nestjs/common";
import { AlarmStateRepository } from "./alarm-state.repository";
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
    AlarmStateRepository,
  ],
  exports: [
    RobotStateRepository,
    PlcPointStateRepository,
    RevisionRepository,
    LinkStateRepository,
    RemovedEntityRepository,
    AlarmStateRepository,
  ],
})
export class StateModule {}
