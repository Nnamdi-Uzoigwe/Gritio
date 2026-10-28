/**
 * Dates are stored as local calendar keys: "YYYY-MM-DD".
 * Timestamps (created_at, completed_at) are stored as UTC ISO strings.
 * Never build a date key from toISOString(), it shifts the day across timezones.
 */
const pad = (n: number) => String(n).padStart(2, "0");

export function toDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
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

export function nowIso(): string {
  return new Date().toISOString();
}
