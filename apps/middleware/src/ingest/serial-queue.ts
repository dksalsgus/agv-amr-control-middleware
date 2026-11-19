/**
 * 작업을 들어온 순서대로 하나씩 실행한다.
 * MQTT 메시지가 동시에 처리되며 seq 판정과 반영 사이에 끼어드는 것을 막는다.
 */
export class SerialQueue {
  private tail: Promise<unknown> = Promise.resolve();

  async run<T>(task: () => Promise<T>): Promise<T> {
    const result = this.tail.then(task);
    this.tail = result.catch(() => undefined);
    return await result;
  }
}
