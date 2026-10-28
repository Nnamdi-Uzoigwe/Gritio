import { fromDateKey, toDateKey } from "./dates";

export function addMonths(key: string, months: number): string {
  const d = fromDateKey(key);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return toDateKey(d);
}

export function endOfYear(key: string): string {
  return `${fromDateKey(key).getFullYear()}-12-31`;
}

export function daysBetween(fromKey: string, toKey: string): number {
  return Math.round(
    (fromDateKey(toKey).getTime() - fromDateKey(fromKey).getTime()) / 86400000,
  );
}

/** Neutral wording on purpose. A passed date is information, not a failure. */
export function describeTarget(
  targetDate: string | null,
  today: string,
): string {
  if (!targetDate) return "No target date";
  const days = daysBetween(today, targetDate);
  if (days > 1) return `${days} days to go`;
  if (days === 1) return "Due tomorrow";
  if (days === 0) return "Due today";
  const ago = Math.abs(days);
  return `Target date was ${ago} ${ago === 1 ? "day" : "days"} ago`;
}
