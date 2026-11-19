/** 실패 응답의 error 필드 */
export class ApiError {
  constructor(
    readonly statusCode: number,
    readonly message: string | string[],
    readonly path: string,
    readonly timestamp: string,
  ) {}
}
