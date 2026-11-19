export class GetMetricsIngestItemDto {
  /** 제조사 코드 + 프로토콜 (예: VENDOR_A MQTT) */
  key!: string;
  received!: number;
  accepted!: number;
  duplicates!: number;
  outOfOrder!: number;
  missed!: number;
  /** missed / (accepted + missed) */
  lossPct!: number;
  latencyP50Ms!: number | null;
  latencyP95Ms!: number | null;
  latencySamples!: number;
}
