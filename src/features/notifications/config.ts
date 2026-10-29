/** One place to tune scheduling. Platform limits are not assumed to be equal, so stay conservative. */
export const NOTIFICATION_CONFIG = {
  /** How many days ahead one-off reminders are scheduled. */
  horizonDays: 7,
  /** Cap on one-off reminders. iOS keeps only the 64 soonest, and the 2 daily ones count once each. */
  maxOneOff: 48,
  channelId: "default",
  /** Identifies notifications owned by Gritio, so reconcile never touches anything else. */
  idPrefix: "gritio:",
  /** Skip reminders closer than this to now, so they cannot fire mid-scheduling. */
  minLeadMs: 5000,
  /** Collapses a burst of data changes into one reconcile. */
  debounceMs: 400,
} as const;
