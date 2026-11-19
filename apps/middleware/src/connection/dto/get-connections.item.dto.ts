export class GetConnectionsItemDto {
  id!: string;
  name!: string;
  vendorCode!: string;
  vendorName!: string;
  protocol!: string;
  enabled!: boolean;
  version!: number;
  deviceCount!: number;
  linkStatus!: string;
  linkChangedAt!: string | null;
}
