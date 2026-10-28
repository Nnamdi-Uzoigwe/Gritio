import { addDays, fromDateKey, toDateKey } from "./dates";

export const STREAK_MILESTONES: readonly number[] = [
  7, 14, 30, 60, 100, 200, 365,
];

export type HabitStatsInput = {
  weekdays: number[];
  startDate: string;
  completionDates: string[];
  today: string;
};

export type HabitStats = {
  /** Consecutive scheduled days completed, counting back from today. */
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  /** Last 30 days: scheduled days that have passed (today counts only once it is done). */
  windowScheduled: number;
  windowCompleted: number;
  /** Set when today's completion lands exactly on a streak milestone. Phase 9 celebrates it. */
  streakMilestoneToday: number | null;
};

/**
 * Rules, in one place:
 * - Days the habit is not scheduled are skipped. They never break a streak.
 * - A scheduled day that has passed without a completion ends the run.
 * - Today, if scheduled and not yet done, neither breaks nor extends anything.
 * - Dates are local calendar keys, compared as strings.
 */
export function computeHabitStats(input: HabitStatsInput): HabitStats {
  const { startDate, today } = input;
  const scheduled = new Set(input.weekdays);
  const done = new Set(input.completionDates);
  const candidate = addDays(today, -29);
  const windowStart = candidate > startDate ? candidate : startDate;

  let run = 0;
  let best = 0;
  let windowScheduled = 0;
  let windowCompleted = 0;

  if (startDate <= today) {
    const cursor = fromDateKey(startDate);
    let key = startDate;
    while (key <= today) {
      const isScheduled = scheduled.has(cursor.getDay());
      const isDone = done.has(key);

      if (isScheduled) {
        if (isDone) {
          run += 1;
          if (run > best) best = run;
        } else if (key < today) {
          run = 0;
        }
      }

      if (key >= windowStart && isScheduled && (isDone || key < today)) {
        windowScheduled += 1;
        if (isDone) windowCompleted += 1;
      }

      cursor.setDate(cursor.getDate() + 1);
      key = toDateKey(cursor);
    }
  }

  return {
    currentStreak: run,
    bestStreak: best,
    totalCompletions: input.completionDates.length,
    windowScheduled,
    windowCompleted,
    streakMilestoneToday:
      done.has(today) && STREAK_MILESTONES.includes(run) ? run : null,
  };
}
