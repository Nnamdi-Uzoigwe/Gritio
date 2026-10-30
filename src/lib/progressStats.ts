import {
    addDays,
    formatShortDate,
    fromDateKey,
    monthLabel,
    startOfWeek,
    toDateKey,
} from "./dates";
import { isScheduledOn } from "./habitDays";

export type RawTask = {
  id: string;
  title: string;
  date: string;
  done: boolean;
  postponedCount: number;
};
export type RawHabit = {
  id: string;
  name: string;
  status: "active" | "archived";
  startDate: string;
  /** Local date the habit was archived, or null. It stops counting from that day on. */
  archivedDate: string | null;
  weekdays: number[];
  completionDates: string[];
};
export type RawStep = {
  id: string;
  title: string;
  goalId: string;
  scheduledDate: string;
  done: boolean;
};

export type DayStat = {
  date: string;
  total: number;
  done: number;
  isFuture: boolean;
};
export type Summary = {
  total: number;
  done: number;
  fraction: number | null;
  percent: number | null;
};
export type HabitRate = {
  id: string;
  name: string;
  archived: boolean;
  scheduled: number;
  completed: number;
};

export type PeriodKind = "week" | "month";
export type Period = { kind: PeriodKind; from: string; to: string };

export function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  if (from > to) return out;
  const cursor = fromDateKey(from);
  let key = from;
  while (key <= to) {
    out.push(key);
    cursor.setDate(cursor.getDate() + 1);
    key = toDateKey(cursor);
  }
  return out;
}

function groupBy<T>(list: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of list) {
    const key = keyOf(item);
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return map;
}

/**
 * A commitment on a day is a task dated that day, a habit scheduled that day, or a goal step
 * scheduled that day. It is done once it has been completed. Future days are not measured.
 */
export function computeDayStats(input: {
  from: string;
  to: string;
  today: string;
  tasks: RawTask[];
  habits: RawHabit[];
  steps: RawStep[];
}): DayStat[] {
  const tasksByDate = groupBy(input.tasks, (t) => t.date);
  const stepsByDate = groupBy(input.steps, (s) => s.scheduledDate);
  const habits = input.habits.map((h) => ({
    habit: h,
    done: new Set(h.completionDates),
  }));

  return eachDay(input.from, input.to).map((date) => {
    if (date > input.today) return { date, total: 0, done: 0, isFuture: true };

    let total = 0;
    let done = 0;
    for (const t of tasksByDate.get(date) ?? []) {
      total += 1;
      if (t.done) done += 1;
    }
    for (const s of stepsByDate.get(date) ?? []) {
      total += 1;
      if (s.done) done += 1;
    }
    for (const { habit, done: completed } of habits) {
      if (!isScheduledOn(habit, date)) continue;
      if (habit.archivedDate !== null && date >= habit.archivedDate) continue;
      total += 1;
      if (completed.has(date)) done += 1;
    }
    return { date, total, done, isFuture: false };
  });
}

/**
 * Totals for a period. Today only counts what has been finished so far,
 * so an unfinished day never lowers your numbers.
 */
export function summarize(days: DayStat[], today: string): Summary {
  let total = 0;
  let done = 0;
  for (const d of days) {
    if (d.isFuture) continue;
    if (d.date === today) {
      total += d.done;
      done += d.done;
    } else {
      total += d.total;
      done += d.done;
    }
  }
  const fraction = total > 0 ? done / total : null;
  return {
    total,
    done,
    fraction,
    percent: fraction === null ? null : Math.round(fraction * 100),
  };
}

/** Per habit: scheduled days that have passed (today only once done) and how many were completed. */
export function habitRates(
  habits: RawHabit[],
  from: string,
  to: string,
  today: string,
): HabitRate[] {
  const end = to < today ? to : today;
  const days = eachDay(from, end);
  const rates: HabitRate[] = [];

  for (const habit of habits) {
    const done = new Set(habit.completionDates);
    let scheduled = 0;
    let completed = 0;
    for (const date of days) {
      if (!isScheduledOn(habit, date)) continue;
      if (habit.archivedDate !== null && date >= habit.archivedDate) continue;
      const isDone = done.has(date);
      if (date < today) {
        scheduled += 1;
        if (isDone) completed += 1;
      } else if (isDone) {
        scheduled += 1;
        completed += 1;
      }
    }
    if (scheduled > 0) {
      rates.push({
        id: habit.id,
        name: habit.name,
        archived: habit.status === "archived",
        scheduled,
        completed,
      });
    }
  }
  return rates;
}

/** Change in percentage points, or null unless both periods have data. */
export function trendPoints(
  current: Summary,
  previous: Summary,
): number | null {
  if (current.percent === null || previous.percent === null) return null;
  return current.percent - previous.percent;
}

export function periodFor(kind: PeriodKind, anchor: string): Period {
  if (kind === "week") {
    const from = startOfWeek(anchor);
    return { kind, from, to: addDays(from, 6) };
  }
  const d = fromDateKey(anchor);
  return {
    kind,
    from: toDateKey(new Date(d.getFullYear(), d.getMonth(), 1)),
    to: toDateKey(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
  };
}

export function shiftPeriod(period: Period, delta: number): Period {
  if (period.kind === "week")
    return periodFor("week", addDays(period.from, 7 * delta));
  const d = fromDateKey(period.from);
  return periodFor(
    "month",
    toDateKey(new Date(d.getFullYear(), d.getMonth() + delta, 1)),
  );
}

export function describePeriod(
  period: Period,
  today: string,
): { label: string; detail: string | null; isCurrent: boolean } {
  const isCurrent = period.from <= today && today <= period.to;
  if (period.kind === "week") {
    const range = `${formatShortDate(period.from)} to ${formatShortDate(period.to)}`;
    return isCurrent
      ? { label: "This week", detail: range, isCurrent }
      : { label: range, detail: null, isCurrent };
  }
  const d = fromDateKey(period.from);
  return {
    label: monthLabel(d.getFullYear(), d.getMonth()),
    detail: isCurrent ? "This month" : null,
    isCurrent,
  };
}
