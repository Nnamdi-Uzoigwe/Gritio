import { requestReconcile } from "@/features/notifications/service";
import { isValidDateKey, nowIso } from "@/lib/dates";
import { newId } from "@/lib/ids";
import { runSerial } from "@/lib/serial";
import { ValidationError } from "@/lib/validation";
import type {
  GoalPlanView,
  MilestoneItem,
  StepInput,
  StepItem,
} from "@/types/steps";
import { getDb } from "../client";

type MilestoneRow = {
  id: string;
  goal_id: string;
  title: string;
  position: number;
  completed_at: string | null;
};
type StepRow = {
  id: string;
  goal_id: string;
  milestone_id: string | null;
  title: string;
  notes: string | null;
  due_date: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  reminder_enabled: number;
  position: number;
  completed_at: string | null;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function mapStep(r: StepRow): StepItem {
  return {
    id: r.id,
    goalId: r.goal_id,
    milestoneId: r.milestone_id,
    title: r.title,
    notes: r.notes,
    dueDate: r.due_date,
    scheduledDate: r.scheduled_date,
    scheduledTime: r.scheduled_time,
    reminderEnabled: r.reminder_enabled === 1,
    position: r.position,
    completedAt: r.completed_at,
  };
}

function cleanTitle(title: string, what: string): string {
  const trimmed = title.trim();
  if (!trimmed) throw new ValidationError(`Give your ${what} a title.`);
  if (trimmed.length > 120)
    throw new ValidationError("Titles can be up to 120 characters.");
  return trimmed;
}

function cleanStep(input: StepInput) {
  const title = cleanTitle(input.title, "step");
  const notes = input.notes?.trim() || null;
  if (notes && notes.length > 500)
    throw new ValidationError("Notes can be up to 500 characters.");

  const dueDate = input.dueDate ?? null;
  if (dueDate !== null && !isValidDateKey(dueDate))
    throw new ValidationError("Choose a valid due date.");

  const scheduledDate = input.scheduledDate ?? null;
  if (scheduledDate !== null && !isValidDateKey(scheduledDate)) {
    throw new ValidationError("Choose a valid day for this step.");
  }

  // A time only makes sense on a scheduled day.
  const scheduledTime = scheduledDate ? (input.scheduledTime ?? null) : null;
  if (scheduledTime !== null && !TIME_PATTERN.test(scheduledTime))
    throw new ValidationError("Choose a valid time.");

  if (
    input.reminderEnabled === true &&
    (scheduledDate === null || scheduledTime === null)
  ) {
    throw new ValidationError("Pick a day and a time to get a reminder.");
  }
  const reminderEnabled =
    input.reminderEnabled === true &&
    scheduledDate !== null &&
    scheduledTime !== null;

  return {
    title,
    notes,
    dueDate,
    scheduledDate,
    scheduledTime,
    reminderEnabled,
  };
}

export async function getGoalPlan(goalId: string): Promise<GoalPlanView> {
  const db = await getDb();
  const [milestoneRows, stepRows] = await Promise.all([
    db.getAllAsync<MilestoneRow>(
      "SELECT id, goal_id, title, position, completed_at FROM milestones WHERE goal_id = ? ORDER BY position ASC, created_at ASC",
      goalId,
    ),
    db.getAllAsync<StepRow>(
      `SELECT id, goal_id, milestone_id, title, notes, due_date, scheduled_date, scheduled_time, reminder_enabled, position, completed_at
       FROM goal_steps WHERE goal_id = ? ORDER BY position ASC, created_at ASC`,
      goalId,
    ),
  ]);

  const steps = stepRows.map(mapStep);
  const milestones: MilestoneItem[] = milestoneRows.map((m) => ({
    id: m.id,
    goalId: m.goal_id,
    title: m.title,
    position: m.position,
    completedAt: m.completed_at,
    steps: steps.filter((s) => s.milestoneId === m.id),
  }));
  return {
    milestones,
    looseSteps: steps.filter((s) => s.milestoneId === null),
  };
}

export async function addMilestone(
  goalId: string,
  title: string,
): Promise<string> {
  const clean = cleanTitle(title, "milestone");
  return runSerial(async () => {
    const db = await getDb();
    const id = newId();
    await db.runAsync(
      `INSERT INTO milestones (id, goal_id, title, position, completed_at, created_at)
       VALUES (?, ?, ?, COALESCE((SELECT MAX(position) + 1 FROM milestones WHERE goal_id = ?), 0), NULL, ?)`,
      id,
      goalId,
      clean,
      goalId,
      nowIso(),
    );
    return id;
  });
}

export async function updateMilestone(
  id: string,
  title: string,
): Promise<void> {
  const clean = cleanTitle(title, "milestone");
  const db = await getDb();
  await db.runAsync("UPDATE milestones SET title = ? WHERE id = ?", clean, id);
}

/** Steps inside the milestone are removed by foreign key cascade, and their reminders are cancelled. */
export async function deleteMilestone(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM milestones WHERE id = ?", id);
  requestReconcile();
}

/** Only meaningful for a milestone with no steps, which counts as one item you tick yourself. */
export async function setMilestoneDone(
  id: string,
  done: boolean,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE milestones SET completed_at = ? WHERE id = ?",
    done ? nowIso() : null,
    id,
  );
}

export async function addStep(
  goalId: string,
  milestoneId: string | null,
  title: string,
): Promise<string> {
  const clean = cleanTitle(title, "step");
  return runSerial(async () => {
    const db = await getDb();
    const id = newId();
    await db.withTransactionAsync(async () => {
      const row = milestoneId
        ? await db.getFirstAsync<{ p: number }>(
            "SELECT COALESCE(MAX(position) + 1, 0) AS p FROM goal_steps WHERE goal_id = ? AND milestone_id = ?",
            goalId,
            milestoneId,
          )
        : await db.getFirstAsync<{ p: number }>(
            "SELECT COALESCE(MAX(position) + 1, 0) AS p FROM goal_steps WHERE goal_id = ? AND milestone_id IS NULL",
            goalId,
          );
      await db.runAsync(
        `INSERT INTO goal_steps
          (id, goal_id, milestone_id, title, notes, due_date, scheduled_date, scheduled_time, reminder_enabled, position, completed_at, created_at)
         VALUES (?, ?, ?, ?, NULL, NULL, NULL, NULL, 0, ?, NULL, ?)`,
        id,
        goalId,
        milestoneId,
        clean,
        row?.p ?? 0,
        nowIso(),
      );
      // A milestone that gets its first step stops being a manual tick item.
      if (milestoneId)
        await db.runAsync(
          "UPDATE milestones SET completed_at = NULL WHERE id = ?",
          milestoneId,
        );
    });
    return id;
  });
}

export async function updateStep(id: string, input: StepInput): Promise<void> {
  const data = cleanStep(input);
  const db = await getDb();
  await db.runAsync(
    `UPDATE goal_steps SET title = ?, notes = ?, due_date = ?, scheduled_date = ?, scheduled_time = ?, reminder_enabled = ?
     WHERE id = ?`,
    data.title,
    data.notes,
    data.dueDate,
    data.scheduledDate,
    data.scheduledTime,
    data.reminderEnabled ? 1 : 0,
    id,
  );
  requestReconcile();
}

export async function setStepDone(id: string, done: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE goal_steps SET completed_at = ? WHERE id = ?",
    done ? nowIso() : null,
    id,
  );
  requestReconcile();
}

/** Puts a step on a day (it then appears on Today) or removes it from the plan with null. */
export async function scheduleStep(
  id: string,
  date: string | null,
): Promise<void> {
  if (date !== null && !isValidDateKey(date))
    throw new ValidationError("Choose a valid day.");
  const db = await getDb();
  if (date === null) {
    await db.runAsync(
      "UPDATE goal_steps SET scheduled_date = NULL, scheduled_time = NULL, reminder_enabled = 0 WHERE id = ?",
      id,
    );
  } else {
    await db.runAsync(
      "UPDATE goal_steps SET scheduled_date = ? WHERE id = ?",
      date,
      id,
    );
  }
  requestReconcile();
}

export async function deleteStep(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM goal_steps WHERE id = ?", id);
  requestReconcile();
}

export async function reorderMilestones(orderedIds: string[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.runAsync(
        "UPDATE milestones SET position = ? WHERE id = ?",
        i,
        orderedIds[i],
      );
    }
  });
}

export async function reorderSteps(orderedIds: string[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.runAsync(
        "UPDATE goal_steps SET position = ? WHERE id = ?",
        i,
        orderedIds[i],
      );
    }
  });
}
