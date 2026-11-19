/** 작업을 순서대로 하나씩 실행한다. 판정과 반영 사이에 다른 메시지가 끼어들지 않게 한다. */
export class SerialQueue {
  private tail: Promise<unknown> = Promise.resolve();

  async run<T>(task: () => Promise<T>): Promise<T> {
    const result = this.tail.then(task);
    this.tail = result.catch(() => undefined);
    return await result;
  }
}
