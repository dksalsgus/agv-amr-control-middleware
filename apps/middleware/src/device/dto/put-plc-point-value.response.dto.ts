export class PutPlcPointValueResponseDto {
  id!: string;
  /** 쓴 값. 실제 값은 다음 폴링에서 읽혀 WebSocket으로 온다. */
  value!: boolean;
}
