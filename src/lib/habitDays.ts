import { weekdayOf } from "./dates";

/** Weekdays use JavaScript numbering: 0 is Sunday, 6 is Saturday. */
export const WEEK_ORDER: number[] = [1, 2, 3, 4, 5, 6, 0]; // displayed Monday first
export const ALL_DAYS: number[] = [0, 1, 2, 3, 4, 5, 6];
export const WEEKDAYS_ONLY: number[] = [1, 2, 3, 4, 5];
export const WEEKENDS: number[] = [0, 6];

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_LETTER = ["S", "M", "T", "W", "T", "F", "S"];
export const WEEKDAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function sameDays(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((d) => set.has(d));
}

export function summarizeSchedule(days: number[]): string {
  const sorted = WEEK_ORDER.filter((d) => days.includes(d));
  if (sorted.length === 0) return "No days";
  if (sorted.length === 7) return "Every day";
  if (sameDays(days, WEEKDAYS_ONLY)) return "Weekdays";
  if (sameDays(days, WEEKENDS)) return "Weekends";
  return sorted.map((d) => WEEKDAY_SHORT[d]).join(", ");
}

/**
 * The one scheduling rule: a habit occurs on a date when that date is on or after its start date
 * and its weekday is in the schedule. (Active status is checked by whoever lists habits.)
 */
export function isScheduledOn(
  habit: { weekdays: number[]; startDate: string },
  dateKey: string,
): boolean {
  return (
    dateKey >= habit.startDate && habit.weekdays.includes(weekdayOf(dateKey))
  );
}
