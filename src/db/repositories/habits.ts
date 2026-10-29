import { requestReconcile } from "@/features/notifications/service";
import { isValidDateKey, nowIso, toDateKey } from "@/lib/dates";
import { isFocusAreaId } from "@/lib/goalMeta";
import { newId } from "@/lib/ids";
import { habitLimitMessage, LIMITS } from "@/lib/limits";
import { runSerial } from "@/lib/serial";
import { LimitError, ValidationError } from "@/lib/validation";
import type { HabitLevel, HabitStatus } from "@/types/domain";
import type { HabitCompletion, HabitInput, HabitItem } from "@/types/habits";
import { getDb } from "../client";

type HabitRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  status: string;
  start_date: string;
  minimum_label: string | null;
  target_label: string | null;
  reminder_time: string | null;
  reminders_enabled: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function toLevel(value: string): HabitLevel {
  return value === "minimum" ? "minimum" : "target";
}

function mapHabit(
  row: HabitRow,
  weekdays: number[],
  completions: HabitCompletion[],
): HabitItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: isFocusAreaId(row.category) ? row.category : null,
    status: row.status === "archived" ? "archived" : "active",
    startDate: row.start_date,
    minimumLabel: row.minimum_label,
    targetLabel: row.target_label,
    timeOfDay: row.reminder_time,
    remindersEnabled: row.reminders_enabled === 1,
    weekdays,
    completions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function cleanHabit(input: HabitInput) {
  const name = input.name.trim();
  if (!name) throw new ValidationError("Give your habit a name.");
  if (name.length > 60)
    throw new ValidationError("Names can be up to 60 characters.");

  const description = input.description?.trim() || null;
  if (description && description.length > 300)
    throw new ValidationError("The description can be up to 300 characters.");

  const category = input.category ?? null;
  if (category !== null && !isFocusAreaId(category))
    throw new ValidationError("Choose a valid category.");

  const weekdays = Array.from(new Set(input.weekdays)).filter(
    (d) => Number.isInteger(d) && d >= 0 && d <= 6,
  );
  if (weekdays.length === 0)
    throw new ValidationError("Choose at least one day.");

  if (!isValidDateKey(input.startDate))
    throw new ValidationError("Choose a valid start date.");

  const timeOfDay = input.timeOfDay ?? null;
  if (timeOfDay !== null && !TIME_PATTERN.test(timeOfDay))
    throw new ValidationError("Choose a valid time.");

  if (input.remindersEnabled === true && timeOfDay === null) {
    throw new ValidationError("Choose a time of day to get a reminder.");
  }
  const remindersEnabled =
    input.remindersEnabled === true && timeOfDay !== null;

  const minimumLabel = input.minimumLabel?.trim() || null;
  const targetLabel = input.targetLabel?.trim() || null;
  if (
    (minimumLabel && minimumLabel.length > 80) ||
    (targetLabel && targetLabel.length > 80)
  ) {
    throw new ValidationError(
      "Minimum and target versions can be up to 80 characters.",
    );
  }

  return {
    name,
    description,
    category,
    weekdays,
    startDate: input.startDate,
    timeOfDay,
    remindersEnabled,
    minimumLabel,
    targetLabel,
  };
}

async function loadHabits(where: string, param: string): Promise<HabitItem[]> {
  const db = await getDb();
  const order = where.includes("status") ? "ORDER BY created_at ASC" : "";
  const [rows, scheduleRows, completionRows] = await Promise.all([
    db.getAllAsync<HabitRow>(
      `SELECT * FROM habits h WHERE ${where} ${order}`,
      param,
    ),
    db.getAllAsync<{ habit_id: string; weekday: number }>(
      `SELECT hs.habit_id, hs.weekday FROM habit_schedules hs JOIN habits h ON h.id = hs.habit_id WHERE ${where}`,
      param,
    ),
    db.getAllAsync<{ habit_id: string; date: string; level: string }>(
      `SELECT hc.habit_id, hc.date, hc.level FROM habit_completions hc JOIN habits h ON h.id = hc.habit_id WHERE ${where}`,
      param,
    ),
  ]);

  const days = new Map<string, number[]>();
  for (const r of scheduleRows)
    days.set(r.habit_id, [...(days.get(r.habit_id) ?? []), r.weekday]);
  const done = new Map<string, HabitCompletion[]>();
  for (const r of completionRows) {
    done.set(r.habit_id, [
      ...(done.get(r.habit_id) ?? []),
      { date: r.date, level: toLevel(r.level) },
    ]);
  }
  return rows.map((row) =>
    mapHabit(row, days.get(row.id) ?? [], done.get(row.id) ?? []),
  );
}

export async function listHabits(status: HabitStatus): Promise<HabitItem[]> {
  const habits = await loadHabits("h.status = ?", status);
  if (status === "archived") {
    return habits.sort((a, b) =>
      (b.archivedAt ?? "").localeCompare(a.archivedAt ?? ""),
    );
  }
  return habits;
}

export async function getHabit(id: string): Promise<HabitItem | null> {
  const habits = await loadHabits("h.id = ?", id);
  return habits[0] ?? null;
}

export async function countActiveHabits(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) AS c FROM habits WHERE status = 'active'",
  );
  return row?.c ?? 0;
}

/** The limit is checked and enforced here, inside a serialized transaction, never only in the UI. */
export async function createHabit(input: HabitInput): Promise<string> {
  const data = cleanHabit(input);
  const id = await runSerial(async () => {
    const db = await getDb();
    const newHabitId = newId();
    await db.withTransactionAsync(async () => {
      const row = await db.getFirstAsync<{ c: number }>(
        "SELECT COUNT(*) AS c FROM habits WHERE status = 'active'",
      );
      if ((row?.c ?? 0) >= LIMITS.maxActiveHabits)
        throw new LimitError(habitLimitMessage, LIMITS.maxActiveHabits);

      const now = nowIso();
      await db.runAsync(
        `INSERT INTO habits
          (id, name, description, category, status, start_date, minimum_label, target_label, reminder_time, reminders_enabled, archived_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, NULL, ?, ?)`,
        newHabitId,
        data.name,
        data.description,
        data.category,
        data.startDate,
        data.minimumLabel,
        data.targetLabel,
        data.timeOfDay,
        data.remindersEnabled ? 1 : 0,
        now,
        now,
      );
      for (const day of data.weekdays) {
        await db.runAsync(
          "INSERT INTO habit_schedules (habit_id, weekday) VALUES (?, ?)",
          newHabitId,
          day,
        );
      }
    });
    return newHabitId;
  });
  requestReconcile();
  return id;
}

/** Schedule changes affect future days only. Past completions are never touched. */
export async function updateHabit(
  id: string,
  input: HabitInput,
): Promise<void> {
  const data = cleanHabit(input);
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE habits SET name = ?, description = ?, category = ?, start_date = ?, minimum_label = ?, target_label = ?,
         reminder_time = ?, reminders_enabled = ?, updated_at = ? WHERE id = ?`,
      data.name,
      data.description,
      data.category,
      data.startDate,
      data.minimumLabel,
      data.targetLabel,
      data.timeOfDay,
      data.remindersEnabled ? 1 : 0,
      nowIso(),
      id,
    );
    await db.runAsync("DELETE FROM habit_schedules WHERE habit_id = ?", id);
    for (const day of data.weekdays) {
      await db.runAsync(
        "INSERT INTO habit_schedules (habit_id, weekday) VALUES (?, ?)",
        id,
        day,
      );
    }
  });
  requestReconcile();
}

export async function archiveHabit(id: string): Promise<void> {
  const db = await getDb();
  const now = nowIso();
  await db.runAsync(
    "UPDATE habits SET status = 'archived', archived_at = ?, updated_at = ? WHERE id = ? AND status = 'active'",
    now,
    now,
    id,
  );
  requestReconcile();
}

/** Archived habit back to active. Respects the active limit. History is untouched. */
export async function restoreHabit(id: string): Promise<void> {
  await runSerial(async () => {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      const habit = await db.getFirstAsync<{ status: string }>(
        "SELECT status FROM habits WHERE id = ?",
        id,
      );
      if (!habit || habit.status !== "archived") return;
      const row = await db.getFirstAsync<{ c: number }>(
        "SELECT COUNT(*) AS c FROM habits WHERE status = 'active'",
      );
      if ((row?.c ?? 0) >= LIMITS.maxActiveHabits)
        throw new LimitError(habitLimitMessage, LIMITS.maxActiveHabits);
      await db.runAsync(
        "UPDATE habits SET status = 'active', archived_at = NULL, updated_at = ? WHERE id = ?",
        nowIso(),
        id,
      );
    });
  });
  requestReconcile();
}

export async function getHabitDeleteSummary(
  id: string,
): Promise<{ completions: number }> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) AS c FROM habit_completions WHERE habit_id = ?",
    id,
  );
  return { completions: row?.c ?? 0 };
}

/** Schedule and completion rows are removed by foreign key cascade in the same transaction. */
export async function deleteHabit(id: string): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM habits WHERE id = ?", id);
  });
  requestReconcile();
}

/**
 * Marks (or changes the level of) a completion, or removes it with level null.
 * One row per habit and date, enforced by the database. Completing today cancels today's reminder.
 */
export async function setHabitCompletion(
  habitId: string,
  date: string,
  level: HabitLevel | null,
): Promise<void> {
  if (!isValidDateKey(date)) throw new ValidationError("Choose a valid day.");
  if (date > toDateKey())
    throw new ValidationError(
      "You can only record days that have already started.",
    );

  const db = await getDb();
  const habit = await db.getFirstAsync<{ start_date: string }>(
    "SELECT start_date FROM habits WHERE id = ?",
    habitId,
  );
  if (!habit) throw new ValidationError("This habit no longer exists.");
  if (date < habit.start_date)
    throw new ValidationError("That day is before this habit started.");

  if (level === null) {
    await db.runAsync(
      "DELETE FROM habit_completions WHERE habit_id = ? AND date = ?",
      habitId,
      date,
    );
  } else {
    await db.runAsync(
      `INSERT INTO habit_completions (id, habit_id, date, level, completed_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(habit_id, date) DO UPDATE SET level = excluded.level`,
      newId(),
      habitId,
      date,
      level,
      nowIso(),
    );
  }
  requestReconcile();
}
