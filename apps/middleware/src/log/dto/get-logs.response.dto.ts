export class GetLogsItemDto {
  id!: string;
  type!: string;
  level!: string;
  targetType!: string;
  targetId!: string;
  message!: string;
  createdAt!: string;
}

export class GetLogsResponseDto {
  items!: GetLogsItemDto[];
  page!: number;
  size!: number;
  total!: number;
}
