import { LOCK_CONFIG } from "./config";

let active = 0;
let lastEnd = 0;

/**
 * System screens (the share sheet, the file picker, the unlock prompt itself) send the app to the
 * background. Wrapping them here stops that from locking the app when the person comes straight back.
 */
export async function withLockSuspended<T>(fn: () => Promise<T>): Promise<T> {
  active += 1;
  try {
    return await fn();
  } finally {
    active -= 1;
    lastEnd = Date.now();
  }
}

export function isLockSuspended(): boolean {
  return active > 0 || Date.now() - lastEnd < LOCK_CONFIG.suspendedGraceMs;
}
