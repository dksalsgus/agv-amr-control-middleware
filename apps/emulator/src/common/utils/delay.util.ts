export const delay = async (ms: number) => {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
};

/** step을 끝까지 기다린 뒤 남은 주기만큼 쉬고 다시 부른다. 끝나지 않는다. */
export const runEvery = async (
  intervalMs: number,
  step: () => Promise<void>,
) => {
  while (true) {
    const startedAt = Date.now();
    await step();
    await delay(Math.max(0, intervalMs - (Date.now() - startedAt)));
  }
};
