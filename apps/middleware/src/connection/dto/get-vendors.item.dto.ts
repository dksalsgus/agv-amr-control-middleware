export class GetVendorsItemDto {
  id!: string;
  code!: string;
  name!: string;
  /** 지원하는 프로토콜별 기본 접속 정보. 키가 곧 지원 프로토콜이다. */
  connectionDefaults!: Record<string, Record<string, unknown>>;
}
