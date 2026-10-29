import { addDays } from "./dates";
import { isScheduledOn } from "./habitDays";

type Schedule = { weekdays: number[]; startDate: string };

/** Scheduled days in the last `days` days (not counting today) that have no completion. */
export function countRecentMisses(
  habit: Schedule,
  completionDates: string[],
  today: string,
  days = 7,
): number {
  const done = new Set(completionDates);
  let misses = 0;
  for (let i = 1; i <= days; i++) {
    const key = addDays(today, -i);
    if (isScheduledOn(habit, key) && !done.has(key)) misses += 1;
  }
  return misses;
}

/** The next scheduled day within two weeks, or null. */
export function nextScheduledDate(
  habit: Schedule,
  from: string,
  includeFrom = false,
): string | null {
  for (let i = includeFrom ? 0 : 1; i <= 14; i++) {
    const key = addDays(from, i);
    if (isScheduledOn(habit, key)) return key;
  }
  return null;
}
