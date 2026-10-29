import { requestReconcile } from "@/features/notifications/service";
import { isValidDateKey, nowIso } from "@/lib/dates";
import { isFocusAreaId, isGoalType } from "@/lib/goalMeta";
import { newId } from "@/lib/ids";
import { goalLimitMessage, LIMITS } from "@/lib/limits";
import { runSerial } from "@/lib/serial";
import { LimitError, ValidationError } from "@/lib/validation";
import type { GoalStatus } from "@/types/domain";
import type { GoalInput, GoalListItem, GoalPlan } from "@/types/goals";
import { getDb } from "../client";

type GoalRow = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  goal_type: string | null;
  status: string;
  start_date: string;
  target_date: string | null;
  completion_criteria: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  step_total: number;
  step_done: number;
  bare_total: number;
  bare_done: number;
  milestone_count: number;
};

const GOAL_SELECT = `
  SELECT g.*,
    (SELECT COUNT(*) FROM goal_steps s WHERE s.goal_id = g.id) AS step_total,
    (SELECT COUNT(*) FROM goal_steps s WHERE s.goal_id = g.id AND s.completed_at IS NOT NULL) AS step_done,
    (SELECT COUNT(*) FROM milestones m WHERE m.goal_id = g.id
       AND NOT EXISTS (SELECT 1 FROM goal_steps s WHERE s.milestone_id = m.id)) AS bare_total,
    (SELECT COUNT(*) FROM milestones m WHERE m.goal_id = g.id AND m.completed_at IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM goal_steps s WHERE s.milestone_id = m.id)) AS bare_done,
    (SELECT COUNT(*) FROM milestones m WHERE m.goal_id = g.id) AS milestone_count
  FROM goals g`;

function toStatus(value: string): GoalStatus {
  return value === "completed" || value === "archived" ? value : "active";
}

function mapRow(r: GoalRow): GoalListItem {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: isFocusAreaId(r.category) ? r.category : null,
    goalType: isGoalType(r.goal_type) ? r.goal_type : null,
    status: toStatus(r.status),
    startDate: r.start_date,
    targetDate: r.target_date,
    completionCriteria: r.completion_criteria,
    completedAt: r.completed_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    milestoneCount: r.milestone_count,
    stepTotal: r.step_total,
    stepDone: r.step_done,
    bareTotal: r.bare_total,
    bareDone: r.bare_done,
  };
}

function clean(input: GoalInput) {
  const title = input.title.trim();
  if (!title) throw new ValidationError("Give your goal a title.");
  if (title.length > 100)
    throw new ValidationError("Titles can be up to 100 characters.");

  const description = input.description?.trim() || null;
  if (description && description.length > 500) {
    throw new ValidationError("The description can be up to 500 characters.");
  }
  const completionCriteria = input.completionCriteria?.trim() || null;
  if (completionCriteria && completionCriteria.length > 300) {
    throw new ValidationError(
      "Completion criteria can be up to 300 characters.",
    );
  }

  const category = input.category ?? null;
  if (category !== null && !isFocusAreaId(category))
    throw new ValidationError("Choose a valid focus area.");
  const goalType = input.goalType ?? null;
  if (goalType !== null && !isGoalType(goalType))
    throw new ValidationError("Choose a valid goal type.");

  if (!isValidDateKey(input.startDate))
    throw new ValidationError("Choose a valid start date.");
  const targetDate = input.targetDate ?? null;
  if (targetDate !== null) {
    if (!isValidDateKey(targetDate))
      throw new ValidationError("Choose a valid target date.");
    if (targetDate < input.startDate)
      throw new ValidationError(
        "The target date cannot be before the start date.",
      );
  }

  return {
    title,
    description,
    completionCriteria,
    category,
    goalType,
    startDate: input.startDate,
    targetDate,
  };
}

function cleanPlan(plan?: GoalPlan | null): GoalPlan {
  const clip = (s: string) => s.trim().slice(0, 120);
  const milestones = (plan?.milestones ?? [])
    .map((m) => ({
      title: clip(m.title),
      steps: m.steps.map(clip).filter(Boolean),
    }))
    .filter((m) => m.title.length > 0);
  const looseSteps = (plan?.looseSteps ?? []).map(clip).filter(Boolean);
  return { milestones, looseSteps };
}

export async function listGoals(status: GoalStatus): Promise<GoalListItem[]> {
  const db = await getDb();
  const order =
    status === "active"
      ? "ORDER BY CASE WHEN g.target_date IS NULL THEN 1 ELSE 0 END, g.target_date ASC, g.created_at DESC"
      : status === "completed"
        ? "ORDER BY g.completed_at DESC"
        : "ORDER BY g.updated_at DESC";
  const rows = await db.getAllAsync<GoalRow>(
    `${GOAL_SELECT} WHERE g.status = ? ${order}`,
    status,
  );
  return rows.map(mapRow);
}

export async function getGoal(id: string): Promise<GoalListItem | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<GoalRow>(
    `${GOAL_SELECT} WHERE g.id = ?`,
    id,
  );
  return row ? mapRow(row) : null;
}

export async function countActiveGoals(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) AS c FROM goals WHERE status = 'active'",
  );
  return row?.c ?? 0;
}

/** Limit is checked and enforced here, inside a serialized transaction, never only in the UI. */
export function createGoal(
  input: GoalInput,
  plan?: GoalPlan | null,
): Promise<string> {
  const data = clean(input);
  const parts = cleanPlan(plan);

  return runSerial(async () => {
    const db = await getDb();
    const id = newId();
    await db.withTransactionAsync(async () => {
      const row = await db.getFirstAsync<{ c: number }>(
        "SELECT COUNT(*) AS c FROM goals WHERE status = 'active'",
      );
      if ((row?.c ?? 0) >= LIMITS.maxActiveGoals) {
        throw new LimitError(goalLimitMessage, LIMITS.maxActiveGoals);
      }

      const now = nowIso();
      await db.runAsync(
        `INSERT INTO goals
          (id, title, description, category, goal_type, status, start_date, target_date, completion_criteria, completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, NULL, ?, ?)`,
        id,
        data.title,
        data.description,
        data.category,
        data.goalType,
        data.startDate,
        data.targetDate,
        data.completionCriteria,
        now,
        now,
      );

      const insertStep = (
        milestoneId: string | null,
        title: string,
        position: number,
      ) =>
        db.runAsync(
          `INSERT INTO goal_steps
            (id, goal_id, milestone_id, title, notes, due_date, scheduled_date, scheduled_time, reminder_enabled, position, completed_at, created_at)
           VALUES (?, ?, ?, ?, NULL, NULL, NULL, NULL, 0, ?, NULL, ?)`,
          newId(),
          id,
          milestoneId,
          title,
          position,
          now,
        );

      let milestonePosition = 0;
      for (const milestone of parts.milestones) {
        const milestoneId = newId();
        await db.runAsync(
          "INSERT INTO milestones (id, goal_id, title, position, completed_at, created_at) VALUES (?, ?, ?, ?, NULL, ?)",
          milestoneId,
          id,
          milestone.title,
          milestonePosition++,
          now,
        );
        let stepPosition = 0;
        for (const title of milestone.steps)
          await insertStep(milestoneId, title, stepPosition++);
      }
      let loosePosition = 0;
      for (const title of parts.looseSteps)
        await insertStep(null, title, loosePosition++);
    });
    return id;
  });
}

/** A renamed goal changes the text of its step reminders, so reminders are reconciled. */
export async function updateGoal(id: string, input: GoalInput): Promise<void> {
  const data = clean(input);
  const db = await getDb();
  await db.runAsync(
    `UPDATE goals SET title = ?, description = ?, category = ?, goal_type = ?, start_date = ?, target_date = ?,
       completion_criteria = ?, updated_at = ? WHERE id = ?`,
    data.title,
    data.description,
    data.category,
    data.goalType,
    data.startDate,
    data.targetDate,
    data.completionCriteria,
    nowIso(),
    id,
  );
  requestReconcile();
}

export async function completeGoal(id: string): Promise<void> {
  const db = await getDb();
  const now = nowIso();
  // Phase 9: the goal completion celebration is triggered by callers of this function.
  await db.runAsync(
    "UPDATE goals SET status = 'completed', completed_at = ?, updated_at = ? WHERE id = ? AND status = 'active'",
    now,
    now,
    id,
  );
  requestReconcile();
}

export async function archiveGoal(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE goals SET status = 'archived', updated_at = ? WHERE id = ? AND status != 'archived'",
    nowIso(),
    id,
  );
  requestReconcile();
}

/** Completed goal back to active. Respects the active limit. */
export async function reopenGoal(id: string): Promise<void> {
  await runSerial(async () => {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      const goal = await db.getFirstAsync<{ status: string }>(
        "SELECT status FROM goals WHERE id = ?",
        id,
      );
      if (!goal || goal.status !== "completed") return;
      const row = await db.getFirstAsync<{ c: number }>(
        "SELECT COUNT(*) AS c FROM goals WHERE status = 'active'",
      );
      if ((row?.c ?? 0) >= LIMITS.maxActiveGoals)
        throw new LimitError(goalLimitMessage, LIMITS.maxActiveGoals);
      await db.runAsync(
        "UPDATE goals SET status = 'active', completed_at = NULL, updated_at = ? WHERE id = ?",
        nowIso(),
        id,
      );
    });
  });
  requestReconcile();
}

/** Archived goal comes back as completed if it was, otherwise as active (which respects the limit). */
export async function restoreGoal(id: string): Promise<void> {
  await runSerial(async () => {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      const goal = await db.getFirstAsync<{
        status: string;
        completed_at: string | null;
      }>("SELECT status, completed_at FROM goals WHERE id = ?", id);
      if (!goal || goal.status !== "archived") return;
      if (goal.completed_at !== null) {
        await db.runAsync(
          "UPDATE goals SET status = 'completed', updated_at = ? WHERE id = ?",
          nowIso(),
          id,
        );
        return;
      }
      const row = await db.getFirstAsync<{ c: number }>(
        "SELECT COUNT(*) AS c FROM goals WHERE status = 'active'",
      );
      if ((row?.c ?? 0) >= LIMITS.maxActiveGoals)
        throw new LimitError(goalLimitMessage, LIMITS.maxActiveGoals);
      await db.runAsync(
        "UPDATE goals SET status = 'active', updated_at = ? WHERE id = ?",
        nowIso(),
        id,
      );
    });
  });
  requestReconcile();
}

export async function getGoalDeleteSummary(
  id: string,
): Promise<{ milestones: number; steps: number }> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ milestones: number; steps: number }>(
    `SELECT (SELECT COUNT(*) FROM milestones WHERE goal_id = ?) AS milestones,
            (SELECT COUNT(*) FROM goal_steps WHERE goal_id = ?) AS steps`,
    id,
    id,
  );
  return row ?? { milestones: 0, steps: 0 };
}

/** Milestones and steps are removed by foreign key cascade in the same transaction. */
export async function deleteGoal(id: string): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM goals WHERE id = ?", id);
  });
  requestReconcile();
}
