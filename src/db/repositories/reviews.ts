import { requestCelebrationCheck } from "@/features/celebrations/evaluate";
import { isValidDateKey, nowIso, startOfWeek, toDateKey } from "@/lib/dates";
import { ValidationError } from "@/lib/validation";
import { getDb } from "../client";

export const MAX_PRIORITIES = 3;

export type WeeklyReview = {
  weekStart: string;
  notes: string;
  priorities: string[];
  completedAt: string;
};

type Row = {
  week_start: string;
  notes: string | null;
  next_priorities: string | null;
  completed_at: string;
};

function mapRow(r: Row): WeeklyReview {
  return {
    weekStart: r.week_start,
    notes: r.notes ?? "",
    priorities: (r.next_priorities ?? "")
      .split("\n")
      .filter((p) => p.trim().length > 0),
    completedAt: r.completed_at,
  };
}

export async function getReview(
  weekStart: string,
): Promise<WeeklyReview | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Row>(
    "SELECT * FROM weekly_reviews WHERE week_start = ?",
    weekStart,
  );
  return row ? mapRow(row) : null;
}

/**
 * Saves a weekly review. Completing one is optional, and a week without a review is never a failure.
 * The week must start on a Monday and cannot be in the future. Only the first save sets the completion
 * time, so editing a review later never triggers another celebration.
 */
export async function saveReview(
  weekStart: string,
  input: { notes: string; priorities: string[] },
): Promise<void> {
  if (!isValidDateKey(weekStart) || startOfWeek(weekStart) !== weekStart) {
    throw new ValidationError("Choose a valid week.");
  }
  if (weekStart > startOfWeek(toDateKey()))
    throw new ValidationError("You can only review weeks that have started.");

  const notes = input.notes.trim();
  if (notes.length > 1000)
    throw new ValidationError("Your notes can be up to 1000 characters.");

  const priorities = input.priorities
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, MAX_PRIORITIES);
  if (priorities.some((p) => p.length > 80))
    throw new ValidationError("Each priority can be up to 80 characters.");

  const db = await getDb();
  await db.runAsync(
    `INSERT INTO weekly_reviews (week_start, notes, next_priorities, completed_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(week_start) DO UPDATE SET notes = excluded.notes, next_priorities = excluded.next_priorities`,
    weekStart,
    notes || null,
    priorities.length > 0 ? priorities.join("\n") : null,
    nowIso(),
  );
  requestCelebrationCheck();
}
