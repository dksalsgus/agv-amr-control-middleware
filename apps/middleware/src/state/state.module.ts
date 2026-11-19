import { Module } from "@nestjs/common";
import { PlcPointStateRepository } from "./plc-point-state.repository";
import { RevisionRepository } from "./revision.repository";
import { RobotStateRepository } from "./robot-state.repository";

/** 메모리 상태 저장소(Repository 계층). 수집(ingest)이 쓰고 조회(device)가 읽는다. */
@Module({
  providers: [
    RobotStateRepository,
    PlcPointStateRepository,
    RevisionRepository,
  ],
  exports: [RobotStateRepository, PlcPointStateRepository, RevisionRepository],
})
export class StateModule {}
