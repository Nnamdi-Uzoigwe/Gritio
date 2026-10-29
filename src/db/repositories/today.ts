import { isValidDateKey, weekdayOf } from "@/lib/dates";
import { ValidationError } from "@/lib/validation";
import type { HabitLevel } from "@/types/domain";
import type { Commitment } from "@/types/today";
import { getDb } from "../client";
import { setHabitCompletion } from "./habits";
import { scheduleStep, setStepDone } from "./steps";
import { postponeTask, setTaskDone } from "./tasks";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  time: string | null;
  status: string;
  goal_title: string | null;
};
type HabitRow = {
  id: string;
  name: string;
  description: string | null;
  reminder_time: string | null;
  minimum_label: string | null;
  target_label: string | null;
  completion_level: string | null;
};
type StepRow = {
  id: string;
  title: string;
  notes: string | null;
  scheduled_time: string | null;
  completed_at: string | null;
  goal_title: string;
};

const SOURCE_RANK = { habit: 0, step: 1, task: 2 } as const;

function compare(a: Commitment, b: Commitment): number {
  if (a.time && b.time)
    return a.time.localeCompare(b.time) || a.title.localeCompare(b.title);
  if (a.time) return -1;
  if (b.time) return 1;
  return (
    SOURCE_RANK[a.source] - SOURCE_RANK[b.source] ||
    a.title.localeCompare(b.title)
  );
}

/** One consolidated list for a day: tasks, scheduled habits and scheduled goal steps. */
export async function getTodayCommitments(date: string): Promise<Commitment[]> {
  const db = await getDb();
  const weekday = weekdayOf(date);

  const [tasks, habits, steps] = await Promise.all([
    db.getAllAsync<TaskRow>(
      `SELECT t.id, t.title, t.description, t.time, t.status, g.title AS goal_title
       FROM tasks t LEFT JOIN goals g ON g.id = t.goal_id
       WHERE t.date = ?`,
      date,
    ),
    db.getAllAsync<HabitRow>(
      `SELECT h.id, h.name, h.description, h.reminder_time, h.minimum_label, h.target_label, hc.level AS completion_level
       FROM habits h
       JOIN habit_schedules hs ON hs.habit_id = h.id AND hs.weekday = ?
       LEFT JOIN habit_completions hc ON hc.habit_id = h.id AND hc.date = ?
       WHERE h.status = 'active' AND h.start_date <= ?`,
      weekday,
      date,
      date,
    ),
    db.getAllAsync<StepRow>(
      `SELECT s.id, s.title, s.notes, s.scheduled_time, s.completed_at, g.title AS goal_title
       FROM goal_steps s JOIN goals g ON g.id = s.goal_id
       WHERE s.scheduled_date = ? AND g.status = 'active'`,
      date,
    ),
  ]);

  const list: Commitment[] = [
    ...tasks.map<Commitment>((r) => ({
      key: `task:${r.id}`,
      source: "task",
      id: r.id,
      title: r.title,
      description: r.description,
      time: r.time,
      done: r.status === "done",
      goalTitle: r.goal_title,
      levels: null,
      doneLevel: null,
    })),
    ...habits.map<Commitment>((r) => ({
      key: `habit:${r.id}`,
      source: "habit",
      id: r.id,
      title: r.name,
      description: r.description,
      time: r.reminder_time,
      done: r.completion_level !== null,
      goalTitle: null,
      levels:
        r.minimum_label || r.target_label
          ? { minimum: r.minimum_label, target: r.target_label }
          : null,
      doneLevel:
        r.completion_level === null
          ? null
          : r.completion_level === "minimum"
            ? "minimum"
            : "target",
    })),
    ...steps.map<Commitment>((r) => ({
      key: `step:${r.id}`,
      source: "step",
      id: r.id,
      title: r.title,
      description: r.notes,
      time: r.scheduled_time,
      done: r.completed_at !== null,
      goalTitle: r.goal_title,
      levels: null,
      doneLevel: null,
    })),
  ];

  return list.sort(compare);
}

/** Routes completion to the right place. Each of them keeps reminders in step. */
export async function setCommitmentDone(
  item: Commitment,
  date: string,
  done: boolean,
  level?: HabitLevel,
): Promise<void> {
  if (item.source === "task") {
    await setTaskDone(item.id, done);
    return;
  }
  if (item.source === "habit") {
    await setHabitCompletion(item.id, date, done ? (level ?? "target") : null);
    return;
  }
  await setStepDone(item.id, done);
}

export async function rescheduleCommitment(
  item: Commitment,
  newDate: string,
): Promise<void> {
  if (!isValidDateKey(newDate))
    throw new ValidationError("Choose a valid date.");
  if (item.source === "task") {
    await postponeTask(item.id, newDate);
    return;
  }
  if (item.source === "step") {
    await scheduleStep(item.id, newDate);
    return;
  }
  throw new Error("Habit occurrences cannot be rescheduled.");
}
