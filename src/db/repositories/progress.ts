import { addDays, formatShortDate, fromDateKey, toDateKey } from "@/lib/dates";
import type { RawHabit, RawStep, RawTask } from "@/lib/progressStats";
import { getDb } from "../client";

export type Accomplishment = {
  id: string;
  kind: "goal" | "milestone" | "review";
  title: string;
  subtitle: string | null;
  date: string; // local date key
};

export type ProgressData = {
  tasks: RawTask[];
  habits: RawHabit[];
  steps: RawStep[];
  reflectionDates: string[];
  /** Goals, milestones and weekly reviews completed inside the range, newest first. */
  accomplishments: Accomplishment[];
};

type MilestoneRow = {
  id: string;
  title: string;
  goal_title: string;
  m_completed: string | null;
  step_id: string | null;
  s_completed: string | null;
};

const localKey = (iso: string) => toDateKey(new Date(iso));
const inRange = (key: string, from: string, to: string) =>
  key >= from && key <= to;

/** Reads only stored records. Nothing here is estimated or filled in. */
export async function loadProgressData(
  from: string,
  to: string,
): Promise<ProgressData> {
  const db = await getDb();

  const [
    taskRows,
    habitRows,
    scheduleRows,
    completionRows,
    stepRows,
    reflectionRows,
    milestoneRows,
    goalRows,
    reviewRows,
  ] = await Promise.all([
    db.getAllAsync<{
      id: string;
      title: string;
      date: string;
      status: string;
      postponed_count: number;
    }>(
      "SELECT id, title, date, status, postponed_count FROM tasks WHERE date >= ? AND date <= ?",
      from,
      to,
    ),
    db.getAllAsync<{
      id: string;
      name: string;
      status: string;
      start_date: string;
      archived_at: string | null;
    }>("SELECT id, name, status, start_date, archived_at FROM habits"),
    db.getAllAsync<{ habit_id: string; weekday: number }>(
      "SELECT habit_id, weekday FROM habit_schedules",
    ),
    db.getAllAsync<{ habit_id: string; date: string }>(
      "SELECT habit_id, date FROM habit_completions WHERE date >= ? AND date <= ?",
      from,
      to,
    ),
    db.getAllAsync<{
      id: string;
      title: string;
      goal_id: string;
      scheduled_date: string;
      completed_at: string | null;
    }>(
      `SELECT s.id, s.title, s.goal_id, s.scheduled_date, s.completed_at
         FROM goal_steps s JOIN goals g ON g.id = s.goal_id
         WHERE g.status != 'archived' AND s.scheduled_date >= ? AND s.scheduled_date <= ?`,
      from,
      to,
    ),
    db.getAllAsync<{ date: string }>(
      "SELECT date FROM reflections WHERE date >= ? AND date <= ?",
      from,
      to,
    ),
    db.getAllAsync<MilestoneRow>(
      `SELECT m.id AS id, m.title AS title, g.title AS goal_title, m.completed_at AS m_completed,
                s.id AS step_id, s.completed_at AS s_completed
         FROM milestones m
         JOIN goals g ON g.id = m.goal_id
         LEFT JOIN goal_steps s ON s.milestone_id = m.id
         WHERE g.status != 'archived'`,
    ),
    db.getAllAsync<{ id: string; title: string; completed_at: string }>(
      "SELECT id, title, completed_at FROM goals WHERE status = 'completed' AND completed_at IS NOT NULL",
    ),
    db.getAllAsync<{ week_start: string; completed_at: string }>(
      "SELECT week_start, completed_at FROM weekly_reviews",
    ),
  ]);

  const days = new Map<string, number[]>();
  for (const r of scheduleRows)
    days.set(r.habit_id, [...(days.get(r.habit_id) ?? []), r.weekday]);
  const done = new Map<string, string[]>();
  for (const r of completionRows)
    done.set(r.habit_id, [...(done.get(r.habit_id) ?? []), r.date]);

  const habits: RawHabit[] = habitRows.map((h) => ({
    id: h.id,
    name: h.name,
    status: h.status === "archived" ? "archived" : "active",
    startDate: h.start_date,
    archivedDate: h.archived_at ? localKey(h.archived_at) : null,
    weekdays: days.get(h.id) ?? [],
    completionDates: done.get(h.id) ?? [],
  }));

  // A milestone with steps is complete when all its steps are, on the day the last one was finished.
  // A milestone with no steps is complete when you ticked it.
  const byMilestone = new Map<
    string,
    {
      title: string;
      goalTitle: string;
      ticked: string | null;
      steps: Array<string | null>;
    }
  >();
  for (const r of milestoneRows) {
    const entry = byMilestone.get(r.id) ?? {
      title: r.title,
      goalTitle: r.goal_title,
      ticked: r.m_completed,
      steps: [],
    };
    if (r.step_id !== null) entry.steps.push(r.s_completed);
    byMilestone.set(r.id, entry);
  }

  const accomplishments: Accomplishment[] = [];

  for (const [id, m] of byMilestone) {
    let completedAt: string | null = null;
    if (m.steps.length === 0) completedAt = m.ticked;
    else if (m.steps.every((s) => s !== null))
      completedAt = (m.steps as string[]).reduce((a, b) => (a > b ? a : b));
    if (!completedAt) continue;
    const date = localKey(completedAt);
    if (inRange(date, from, to))
      accomplishments.push({
        id: `milestone:${id}`,
        kind: "milestone",
        title: m.title,
        subtitle: m.goalTitle,
        date,
      });
  }

  for (const g of goalRows) {
    const date = localKey(g.completed_at);
    if (inRange(date, from, to))
      accomplishments.push({
        id: `goal:${g.id}`,
        kind: "goal",
        title: g.title,
        subtitle: "Goal completed",
        date,
      });
  }

  for (const r of reviewRows) {
    const date = localKey(r.completed_at);
    if (inRange(date, from, to)) {
      accomplishments.push({
        id: `review:${r.week_start}`,
        kind: "review",
        title: "Weekly review",
        subtitle: `Week of ${formatShortDate(r.week_start)}`,
        date,
      });
    }
  }

  accomplishments.sort((a, b) => b.date.localeCompare(a.date));

  return {
    tasks: taskRows.map((t) => ({
      id: t.id,
      title: t.title,
      date: t.date,
      done: t.status === "done",
      postponedCount: t.postponed_count,
    })),
    habits,
    steps: stepRows.map((s) => ({
      id: s.id,
      title: s.title,
      goalId: s.goal_id,
      scheduledDate: s.scheduled_date,
      done: s.completed_at !== null,
    })),
    reflectionDates: reflectionRows.map((r) => r.date),
    accomplishments,
  };
}

/** Steps finished between two local dates (inclusive), per active or completed goal. */
export async function stepsCompletedByGoal(
  from: string,
  to: string,
): Promise<Map<string, number>> {
  const db = await getDb();
  const start = fromDateKey(from).toISOString();
  const end = fromDateKey(addDays(to, 1)).toISOString();
  const rows = await db.getAllAsync<{ id: string; c: number }>(
    `SELECT g.id AS id, COUNT(*) AS c
     FROM goal_steps s JOIN goals g ON g.id = s.goal_id
     WHERE s.completed_at >= ? AND s.completed_at < ? AND g.status != 'archived'
     GROUP BY g.id`,
    start,
    end,
  );
  return new Map(rows.map((r) => [r.id, r.c]));
}
