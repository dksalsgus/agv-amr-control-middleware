import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

/** 전역 공통 페이지네이션 요청. 목록 API의 요청 DTO가 상속한다. */
export class PageRequestDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  size: number = 100;

  get skip(): number {
    return (this.page - 1) * this.size;
  }
}
