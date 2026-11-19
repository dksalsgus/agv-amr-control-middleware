import { Module } from "@nestjs/common";
import { RevisionRepository } from "./revision.repository";
import { RobotStateRepository } from "./robot-state.repository";

/** 메모리 상태 저장소(Repository 계층). 수집(ingest)이 쓰고 조회(device)가 읽는다. */
@Module({
  providers: [RobotStateRepository, RevisionRepository],
  exports: [RobotStateRepository, RevisionRepository],
})
export class StateModule {}
