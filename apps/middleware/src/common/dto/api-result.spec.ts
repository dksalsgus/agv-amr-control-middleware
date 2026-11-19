import { ApiResult } from "./api-result";

describe("ApiResult", () => {
  it("성공이면 data를 담고 error는 null이다", () => {
    const result = ApiResult.ofSuccess({ status: "ok" });

    expect(result).toEqual({
      success: true,
      data: { status: "ok" },
      error: null,
    });
  });

  it("data 없이 성공하면 data는 null이다", () => {
    expect(ApiResult.ofSuccess().data).toBeNull();
  });

  it("실패면 data는 null이고 error에 상태 코드와 경로를 담는다", () => {
    const result = ApiResult.ofError(404, "로봇 없음", "/robots/x");

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.error).toMatchObject({
      statusCode: 404,
      message: "로봇 없음",
      path: "/robots/x",
    });
  });
});
