export class GetVendorsItemDto {
  id!: string;
  code!: string;
  name!: string;
}

export class GetVendorsResponseDto {
  vendors!: GetVendorsItemDto[];
}
