import type {
    PlannerHabit,
    PlannerStep,
    PlannerTask,
} from "@/features/notifications/planner";
import { getDb } from "../client";

/** Reads only what the planner can use: pending, reminder enabled, with a time, inside the window. */
export async function loadPlannerData(
  from: string,
  to: string,
): Promise<{
  tasks: PlannerTask[];
  steps: PlannerStep[];
  habits: PlannerHabit[];
}> {
  const db = await getDb();

  const [taskRows, stepRows, habitRows] = await Promise.all([
    db.getAllAsync<{ id: string; title: string; date: string; time: string }>(
      `SELECT id, title, date, time FROM tasks
       WHERE status = 'pending' AND reminder_enabled = 1 AND time IS NOT NULL AND date >= ? AND date <= ?`,
      from,
      to,
    ),
    db.getAllAsync<{
      id: string;
      title: string;
      goal_title: string;
      scheduled_date: string;
      scheduled_time: string;
    }>(
      `SELECT s.id, s.title, g.title AS goal_title, s.scheduled_date, s.scheduled_time
       FROM goal_steps s JOIN goals g ON g.id = s.goal_id
       WHERE g.status = 'active' AND s.completed_at IS NULL AND s.reminder_enabled = 1
         AND s.scheduled_time IS NOT NULL AND s.scheduled_date >= ? AND s.scheduled_date <= ?`,
      from,
      to,
    ),
    db.getAllAsync<{
      id: string;
      name: string;
      target_label: string | null;
      start_date: string;
      reminder_time: string;
    }>(
      `SELECT id, name, target_label, start_date, reminder_time FROM habits
       WHERE status = 'active' AND reminders_enabled = 1 AND reminder_time IS NOT NULL`,
    ),
  ]);

  let habits: PlannerHabit[] = [];
  if (habitRows.length > 0) {
    const [scheduleRows, doneRows] = await Promise.all([
      db.getAllAsync<{ habit_id: string; weekday: number }>(
        `SELECT hs.habit_id, hs.weekday FROM habit_schedules hs
         JOIN habits h ON h.id = hs.habit_id WHERE h.status = 'active' AND h.reminders_enabled = 1`,
      ),
      db.getAllAsync<{ habit_id: string; date: string }>(
        "SELECT habit_id, date FROM habit_completions WHERE date >= ? AND date <= ?",
        from,
        to,
      ),
    ]);
    const days = new Map<string, number[]>();
    for (const r of scheduleRows)
      days.set(r.habit_id, [...(days.get(r.habit_id) ?? []), r.weekday]);
    const done = new Map<string, string[]>();
    for (const r of doneRows)
      done.set(r.habit_id, [...(done.get(r.habit_id) ?? []), r.date]);

    habits = habitRows.map((h) => ({
      id: h.id,
      name: h.name,
      targetLabel: h.target_label,
      startDate: h.start_date,
      time: h.reminder_time,
      weekdays: days.get(h.id) ?? [],
      completedDates: done.get(h.id) ?? [],
    }));
  }

  return {
    tasks: taskRows,
    steps: stepRows.map((s) => ({
      id: s.id,
      title: s.title,
      goalTitle: s.goal_title,
      date: s.scheduled_date,
      time: s.scheduled_time,
    })),
    habits,
  };
}
