/**
 * 오류를 사람이 읽을 문장으로. modbus-serial처럼 Error가 아닌 객체로 거절하는
 * 라이브러리가 있어 String(error)만 쓰면 "[object Object]"가 된다.
 */
export const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  const message = (error as { message?: unknown } | null)?.message;
  if (typeof message === "string") {
    return message;
  }

  const isPlainObject = typeof error === "object" && error !== null;
  return isPlainObject ? JSON.stringify(error) : String(error);
};
