import { GetMetricsConnectionsItemDto } from "./get-metrics-connections.item.dto";

export class GetMetricsConnectionsResponseDto {
  /** 최근 몇 초 동안의 건수인지 */
  windowSec!: number;
  connections!: GetMetricsConnectionsItemDto[];
}
