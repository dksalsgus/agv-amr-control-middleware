/** ms만큼 기다린다. */
export const delay = async (ms: number) => {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
};
