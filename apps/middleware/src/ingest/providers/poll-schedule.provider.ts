import { Injectable } from "@nestjs/common";
import { PollJob, PollOnce } from "./poll-schedule.types";

/**
 * 폴링 연결(REST, Modbus)의 차례. 수집 Service가 연결을 붙일 때 넣고 뗄 때 뺀다.
 * 연결별 간격이 매번 달라(DOWN이면 늘어남) 다음 폴링 시각을 연결마다 따로 둔다.
 */
@Injectable()
export class PollScheduleProvider {
  private readonly polls = new Map<string, PollJob>();

  /** 이미 있으면 차례를 그대로 둔다. 설정이 바뀌어도 다음 폴링이 새 설정을 읽는다. */
  add(connectionId: string, pollOnce: PollOnce): void {
    if (this.polls.has(connectionId)) {
      return;
    }

    this.polls.set(connectionId, {
      pollOnce,
      nextAt: Date.now(),
      running: false,
    });
  }

  remove(connectionId: string): void {
    this.polls.delete(connectionId);
  }

  /** 다음 폴링 시각이 된 연결만 폴링한다. 끝나기를 기다리지 않는다. */
  runDue(now: number): void {
    for (const [connectionId, job] of this.polls) {
      const isDue = !job.running && job.nextAt <= now;
      if (isDue) {
        void this.run(connectionId, job);
      }
    }
  }

  /** 한 번 폴링하고 돌려받은 간격으로 다음 시각을 정한다. 연결이 없으면(null) 차례에서 뺀다. */
  private async run(connectionId: string, job: PollJob): Promise<void> {
    job.running = true;
    try {
      const nextDelayMs = await job.pollOnce(connectionId);
      if (nextDelayMs === null) {
        this.removeIfSame(connectionId, job);
        return;
      }

      job.nextAt = Date.now() + nextDelayMs;
    } finally {
      job.running = false;
    }
  }

  /** 폴링하는 동안 연결이 다시 붙어 새 차례가 들어왔으면 그것은 두고 뺀다. */
  private removeIfSame(connectionId: string, job: PollJob): void {
    if (this.polls.get(connectionId) === job) {
      this.polls.delete(connectionId);
    }
  }
}
