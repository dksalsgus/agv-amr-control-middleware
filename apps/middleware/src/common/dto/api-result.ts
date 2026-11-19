/** 실패 응답의 error 필드 */
export class ApiError {
  constructor(
    readonly statusCode: number,
    readonly message: string | string[],
    readonly path: string,
    readonly timestamp: string,
  ) {}
}

/** 모든 HTTP 응답의 공통 구조: { success, data, error } */
export class ApiResult<T> {
  private constructor(
    readonly success: boolean,
    readonly data: T | null,
    readonly error: ApiError | null,
  ) {}

  static ofSuccess(): ApiResult<null>;
  static ofSuccess<T>(data: T): ApiResult<T>;
  static ofSuccess<T>(data?: T): ApiResult<T | null> {
    return new ApiResult<T | null>(true, data ?? null, null);
  }

  static ofError(
    statusCode: number,
    message: string | string[],
    path: string,
  ): ApiResult<null> {
    const error = new ApiError(
      statusCode,
      message,
      path,
      new Date().toISOString(),
    );
    return new ApiResult<null>(false, null, error);
  }
}
