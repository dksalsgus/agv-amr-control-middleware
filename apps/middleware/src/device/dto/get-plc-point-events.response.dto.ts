export class GetPlcPointEventsItemDto {
  id!: string;
  value!: boolean;
  seq!: number;
  sourceTs!: string;
  receivedTs!: string;
}

export class GetPlcPointEventsResponseDto {
  items!: GetPlcPointEventsItemDto[];
  page!: number;
  size!: number;
  total!: number;
}
