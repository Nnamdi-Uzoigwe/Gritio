export const LOCK_CONFIG = {
  /** How long Gritio can sit in the background before it locks again. */
  graceMs: 60_000,
  /** Returning from the share sheet or file picker within this window never locks. */
  suspendedGraceMs: 2_000,
} as const;
