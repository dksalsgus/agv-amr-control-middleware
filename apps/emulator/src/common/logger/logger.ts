/** 에뮬레이터 로거. 출처를 앞에 붙여 콘솔에 쓴다. */
export class Logger {
  constructor(private readonly context: string) {}

  log(message: string) {
    console.log(`[${this.context}] ${message}`);
  }

  error(message: string) {
    console.error(`[${this.context}] ${message}`);
  }
}
