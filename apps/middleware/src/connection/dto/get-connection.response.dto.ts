export class GetConnectionResponseDto {
  id!: string;
  name!: string;
  vendorCode!: string;
  vendorName!: string;
  protocol!: string;
  enabled!: boolean;
  version!: number;
  deviceCount!: number;
  /** 비밀번호는 내보내지 않는다. */
  config!: Record<string, unknown>;
  hasPassword!: boolean;
  linkStatus!: string;
  linkChangedAt!: string | null;
}
