import { GetMetricsIngestItemDto } from "./get-metrics.ingest-item.dto";
import { GetMetricsProcessDto } from "./get-metrics.process.dto";

export class GetMetricsResponseDto {
  /** 집계를 시작한 시각(서버 시작 또는 마지막 초기화) */
  since!: string;
  ingest!: GetMetricsIngestItemDto[];
  process!: GetMetricsProcessDto;
}
