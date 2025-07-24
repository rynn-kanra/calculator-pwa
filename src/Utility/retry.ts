export function delay(delay?: number) {
  return new Promise(resolve => setTimeout(resolve, delay));
}
export async function retry(fn: () => Promise<boolean | undefined>, delays?: number[]) {
  if (!Array.isArray(delays)) {
    delays = [1000];
  }

  let count = 0;
  while (true) {
    try {
      const resetRetry = await fn();
      if (resetRetry) {
        count = 0;
        throw new Error('force retry');
      }
      break;
    } catch (err) {
      await delay(delays![count]);
      if (count < delays.length - 1) {
        count++;
      }
    }
  }
}