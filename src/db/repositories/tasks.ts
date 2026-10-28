import { isValidDateKey, nowIso } from "@/lib/dates";
import { newId } from "@/lib/ids";
import { ValidationError } from "@/lib/validation";
import { getDb } from "../client";

export type TaskInput = {
  title: string;
  description?: string | null;
  date: string;
  time?: string | null;
};

export type OverdueTask = {
  id: string;
  title: string;
  date: string;
  time: string | null;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function clean(input: TaskInput) {
  const title = input.title.trim();
  if (!title) throw new ValidationError("Give your task a title.");
  if (title.length > 120)
    throw new ValidationError("Titles can be up to 120 characters.");

  const description = input.description?.trim() || null;
  if (description && description.length > 500) {
    throw new ValidationError("Details can be up to 500 characters.");
  }
  if (!isValidDateKey(input.date))
    throw new ValidationError("Choose a valid date.");

  const time = input.time ?? null;
  if (time !== null && !TIME_PATTERN.test(time))
    throw new ValidationError("Choose a valid time.");

  return { title, description, date: input.date, time };
}

// Phase 7 note: the notification service will hook into create, update, complete,
// postpone and delete below so reminders stay in sync. No screen schedules anything itself.

export async function createTask(input: TaskInput): Promise<string> {
  const data = clean(input);
  const db = await getDb();
  const id = newId();
  const now = nowIso();
  await db.runAsync(
    `INSERT INTO tasks
      (id, title, description, date, time, reminder_enabled, status, completed_at, goal_id, habit_id, postponed_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, 'pending', NULL, NULL, NULL, 0, ?, ?)`,
    id,
    data.title,
    data.description,
    data.date,
    data.time,
    now,
    now,
  );
  return id;
}

export async function updateTask(id: string, input: TaskInput): Promise<void> {
  const data = clean(input);
  const db = await getDb();
  await db.runAsync(
    "UPDATE tasks SET title = ?, description = ?, date = ?, time = ?, updated_at = ? WHERE id = ?",
    data.title,
    data.description,
    data.date,
    data.time,
    nowIso(),
    id,
  );
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM tasks WHERE id = ?", id);
}

export async function setTaskDone(id: string, done: boolean): Promise<void> {
  const db = await getDb();
  const now = nowIso();
  await db.runAsync(
    "UPDATE tasks SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?",
    done ? "done" : "pending",
    done ? now : null,
    now,
    id,
  );
}

export async function postponeTask(id: string, date: string): Promise<void> {
  if (!isValidDateKey(date)) throw new ValidationError("Choose a valid date.");
  const db = await getDb();
  await db.runAsync(
    "UPDATE tasks SET date = ?, postponed_count = postponed_count + 1, updated_at = ? WHERE id = ?",
    date,
    nowIso(),
    id,
  );
}

/** Moves unfinished tasks to a day. This is not counted as a postponement. */
export async function moveTasksToDate(
  ids: string[],
  date: string,
): Promise<void> {
  if (!isValidDateKey(date)) throw new ValidationError("Choose a valid date.");
  if (ids.length === 0) return;
  const db = await getDb();
  const now = nowIso();
  await db.withTransactionAsync(async () => {
    for (const id of ids) {
      await db.runAsync(
        "UPDATE tasks SET date = ?, updated_at = ? WHERE id = ? AND status = ?",
        date,
        now,
        id,
        "pending",
      );
    }
  });
}

export async function getOverdueTasks(today: string): Promise<OverdueTask[]> {
  const db = await getDb();
  return db.getAllAsync<OverdueTask>(
    `SELECT id, title, date, time FROM tasks
     WHERE status = 'pending' AND date < ?
     ORDER BY date DESC, time ASC
     LIMIT 50`,
    today,
  );
}

export async function countOverdueTasks(today: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) AS c FROM tasks WHERE status = 'pending' AND date < ?",
    today,
  );
  return row?.c ?? 0;
}
