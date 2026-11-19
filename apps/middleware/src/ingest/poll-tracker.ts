type PollState = {
  lastPolledAt: number;
  inFlight: boolean;
};

/**
 * 연결별 폴링 시점 기록. 주기가 지났고 이전 요청이 끝났을 때만 다음 폴링을 허락한다.
 */
export class PollTracker {
  private readonly states = new Map<string, PollState>();

  isDue(connectionId: string, intervalMs: number, now: number): boolean {
    const state = this.states.get(connectionId);
    if (!state) {
      return true;
    }

    return !state.inFlight && now - state.lastPolledAt >= intervalMs;
  }

  begin(connectionId: string, now: number) {
    this.states.set(connectionId, { lastPolledAt: now, inFlight: true });
  }

  end(connectionId: string, startedAt: number) {
    this.states.set(connectionId, { lastPolledAt: startedAt, inFlight: false });
  }
}
