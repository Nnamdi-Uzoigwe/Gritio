let chain: Promise<void> = Promise.resolve();

/** Runs async tasks one at a time, so a limit check and its insert can never interleave. */
export function runSerial<T>(task: () => Promise<T>): Promise<T> {
  const result = chain.then(() => task());
  chain = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}
