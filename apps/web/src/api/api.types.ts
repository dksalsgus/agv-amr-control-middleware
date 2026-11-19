/** 미들웨어의 공통 응답 구조 { success, data, error } */
export type ApiError = {
  statusCode: number;
  message: string | string[];
  path: string;
  timestamp: string;
};

export type ApiResult<T> = {
  success: boolean;
  data: T | null;
  error: ApiError | null;
};
