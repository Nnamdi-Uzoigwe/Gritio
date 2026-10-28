/**
 * Dates are stored as local calendar keys: "YYYY-MM-DD".
 * Timestamps (created_at, completed_at) are stored as UTC ISO strings.
 * Never build a date key from toISOString(), it shifts the day across timezones.
 */
const pad = (n: number) => String(n).padStart(2, "0");

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isValidDateKey(key: string): boolean {
  if (!DATE_KEY_PATTERN.test(key)) return false;
  return toDateKey(fromDateKey(key)) === key;
}

export function addDays(key: string, days: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function weekdayOf(key: string): number {
  return fromDateKey(key).getDay();
}

/** Week starts on Monday. */
export function startOfWeek(key: string): string {
  const day = weekdayOf(key);
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(key, diff);
}

/** The next Monday strictly after the given day. */
export function nextMonday(key: string): string {
  const day = weekdayOf(key);
  const diff = (8 - day) % 7 || 7;
  return addDays(key, diff);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function formatLongDate(key: string): string {
  const d = fromDateKey(key);
  return `${WEEKDAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

export function formatShortDate(key: string): string {
  const d = fromDateKey(key);
  return `${WEEKDAY_NAMES[d.getDay()].slice(0, 3)}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`;
}

export function describeDate(key: string, today: string): string {
  if (key === today) return "Today";
  if (key === addDays(today, 1)) return "Tomorrow";
  return formatShortDate(key);
}

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
