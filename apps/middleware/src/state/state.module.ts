import { Module } from "@nestjs/common";
import { LinkStateRepository } from "./link-state.repository";
import { PlcPointStateRepository } from "./plc-point-state.repository";
import { RevisionRepository } from "./revision.repository";
import { RobotStateRepository } from "./robot-state.repository";

/** 메모리 상태 저장소 */
@Module({
  providers: [
    RobotStateRepository,
    PlcPointStateRepository,
    RevisionRepository,
    LinkStateRepository,
  ],
  exports: [
    RobotStateRepository,
    PlcPointStateRepository,
    RevisionRepository,
    LinkStateRepository,
  ],
})
export class StateModule {}
