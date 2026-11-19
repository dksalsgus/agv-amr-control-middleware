import { PollScheduleProvider } from "./poll-schedule.provider";

describe("PollScheduleProvider", () => {
  const flush = async () => {
    await new Promise((resolve) => setImmediate(resolve));
  };

  it("차례가 된 연결만 폴링하고 돌려받은 간격 뒤에 다시 폴링한다", async () => {
    const provider = new PollScheduleProvider();
    const pollOnce = jest.fn().mockResolvedValue(1000);
    provider.add("c1", pollOnce);

    provider.runDue(Date.now());
    await flush();
    provider.runDue(Date.now());
    await flush();

    expect(pollOnce).toHaveBeenCalledTimes(1);
  });

  it("뺀 연결은 폴링하지 않는다", async () => {
    const provider = new PollScheduleProvider();
    const pollOnce = jest.fn().mockResolvedValue(0);
    provider.add("c1", pollOnce);
    provider.remove("c1");

    provider.runDue(Date.now());
    await flush();

    expect(pollOnce).not.toHaveBeenCalled();
  });

  it("폴링이 null을 돌려주면 차례에서 뺀다", async () => {
    const provider = new PollScheduleProvider();
    const pollOnce = jest.fn().mockResolvedValue(null);
    provider.add("c1", pollOnce);

    provider.runDue(Date.now());
    await flush();
    provider.runDue(Date.now() + 10_000);
    await flush();

    expect(pollOnce).toHaveBeenCalledTimes(1);
  });
});
