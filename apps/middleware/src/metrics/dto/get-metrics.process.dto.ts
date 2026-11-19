export class GetMetricsProcessDto {
  samples!: number;
  cpuAvgPct!: number | null;
  cpuMaxPct!: number | null;
  rssLatestMb!: number | null;
  rssMaxMb!: number | null;
  heapUsedLatestMb!: number | null;
}
