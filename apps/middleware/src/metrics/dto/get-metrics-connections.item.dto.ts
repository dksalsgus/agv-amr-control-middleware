export class GetMetricsConnectionsItemDto {
  connectionId!: string;
  /** 구간 동안 받은 메시지 수(버린 것 포함) */
  received!: number;
  /** 이미 받은 seq라 버린 수 */
  duplicates!: number;
  /** 더 새로운 seq를 받은 뒤 늦게 와서 버린 수 */
  outOfOrder!: number;
  /** LINK_LOSS 알람과 같은 기준의 유실률(%). 표본이 적으면 null */
  lossPct!: number | null;
}
