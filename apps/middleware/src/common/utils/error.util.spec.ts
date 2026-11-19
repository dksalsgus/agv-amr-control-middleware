import { toErrorMessage } from "./error.util";

describe("toErrorMessage", () => {
  it("Error는 이름과 메시지를 쓴다", () => {
    expect(toErrorMessage(new TypeError("fetch failed"))).toBe(
      "TypeError: fetch failed",
    );
  });

  it("message가 있는 일반 객체는 그 메시지를 쓴다", () => {
    expect(
      toErrorMessage({
        name: "TransactionTimedOutError",
        message: "Timed out",
      }),
    ).toBe("Timed out");
  });

  it("message가 없는 객체는 JSON으로, 나머지는 문자열로 쓴다", () => {
    expect(toErrorMessage({ errno: "ETIMEDOUT" })).toBe(
      '{"errno":"ETIMEDOUT"}',
    );
    expect(toErrorMessage("boom")).toBe("boom");
  });
});
