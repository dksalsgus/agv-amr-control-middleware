/** 실패 응답을 상태 코드와 함께 화면에 넘긴다. 400·409를 구분해 보여 주기 위해서다. */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly messages: string[],
  ) {
    super(messages.join(", "));
  }
}
