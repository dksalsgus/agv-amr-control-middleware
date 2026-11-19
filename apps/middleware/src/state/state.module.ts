import { Module } from "@nestjs/common";
import { AlarmStateRepository } from "./alarm-state.repository";
import { IngestMetricsRepository } from "./ingest-metrics.repository";
import { LinkQualityRepository } from "./link-quality.repository";
import { SeqWindowRepository } from "./seq-window.repository";
import { LinkStateRepository } from "./link-state.repository";
import { ProcessMetricsRepository } from "./process-metrics.repository";
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
    LinkQualityRepository,
    SeqWindowRepository,
    RemovedEntityRepository,
    AlarmStateRepository,
    IngestMetricsRepository,
    ProcessMetricsRepository,
  ],
  exports: [
    RobotStateRepository,
    PlcPointStateRepository,
    RevisionRepository,
    LinkStateRepository,
    LinkQualityRepository,
    SeqWindowRepository,
    RemovedEntityRepository,
    AlarmStateRepository,
    IngestMetricsRepository,
    ProcessMetricsRepository,
  ],
})
export class StateModule {}
