import { isValidDateKey, startOfWeek } from "@/lib/dates";
import { FOCUS_AREA_IDS, isGoalType } from "@/lib/goalMeta";
import { LIMITS } from "@/lib/limits";
import {
    BACKUP_APP,
    BACKUP_FORMAT,
    BACKUP_SETTING_KEYS,
    SCHEMA_VERSION,
    TABLE_COLUMNS,
    type BackupData,
    type BackupFile,
    type Row,
    type TableName,
} from "./format";

export type BackupSummary = {
  exportedAt: string;
  appVersion: string;
  goals: number;
  activeGoals: number;
  milestones: number;
  steps: number;
  habits: number;
  activeHabits: number;
  completions: number;
  tasks: number;
  reflections: number;
  reviews: number;
  rules: number;
  hasReminders: boolean;
};

export type ValidationResult =
  | { ok: true; backup: BackupFile; summary: BackupSummary }
  | { ok: false; kind: "invalid" | "newer"; errors: string[] };

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const ID = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_REPORTED = 8;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

class Checker {
  readonly errors: string[] = [];
  count = 0;

  fail(message: string): void {
    this.count += 1;
    if (this.errors.length < MAX_REPORTED) this.errors.push(message);
  }

  text(
    row: Row,
    field: string,
    label: string,
    max: number,
    required: boolean,
  ): string | null {
    const value = row[field];
    if (value === null || value === undefined) {
      if (required) this.fail(`${label}: "${field}" is missing.`);
      return null;
    }
    if (typeof value !== "string") {
      this.fail(`${label}: "${field}" must be text.`);
      return null;
    }
    if (required && value.trim().length === 0) {
      this.fail(`${label}: "${field}" is empty.`);
      return null;
    }
    if (value.length > max) {
      this.fail(`${label}: "${field}" is too long.`);
      return null;
    }
    return value;
  }

  id(row: Row, field: string, label: string, required = true): string | null {
    const value = this.text(row, field, label, 64, required);
    if (value !== null && !ID.test(value)) {
      this.fail(`${label}: "${field}" is not a valid id.`);
      return null;
    }
    return value;
  }

  date(
    row: Row,
    field: string,
    label: string,
    required: boolean,
  ): string | null {
    const value = this.text(row, field, label, 10, required);
    if (value !== null && !isValidDateKey(value)) {
      this.fail(`${label}: "${field}" is not a valid date.`);
      return null;
    }
    return value;
  }

  time(
    row: Row,
    field: string,
    label: string,
    required: boolean,
  ): string | null {
    const value = this.text(row, field, label, 5, required);
    if (value !== null && !TIME.test(value)) {
      this.fail(`${label}: "${field}" is not a valid time.`);
      return null;
    }
    return value;
  }

  stamp(
    row: Row,
    field: string,
    label: string,
    required: boolean,
  ): string | null {
    const value = this.text(row, field, label, 40, required);
    if (value !== null && Number.isNaN(Date.parse(value))) {
      this.fail(`${label}: "${field}" is not a valid timestamp.`);
      return null;
    }
    return value;
  }

  int(
    row: Row,
    field: string,
    label: string,
    min: number,
    max: number,
  ): number | null {
    const value = row[field];
    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < min ||
      value > max
    ) {
      this.fail(
        `${label}: "${field}" must be a whole number from ${min} to ${max}.`,
      );
      return null;
    }
    return value;
  }

  oneOf(
    row: Row,
    field: string,
    label: string,
    allowed: readonly string[],
    required: boolean,
  ): string | null {
    const value = row[field];
    if (value === null || value === undefined) {
      if (required) this.fail(`${label}: "${field}" is missing.`);
      return null;
    }
    if (typeof value !== "string" || !allowed.includes(value)) {
      this.fail(`${label}: "${field}" has an unknown value.`);
      return null;
    }
    return value;
  }

  category(row: Row, field: string, label: string): void {
    const value = row[field];
    if (value === null || value === undefined) return;
    if (typeof value !== "string" || !FOCUS_AREA_IDS.has(value))
      this.fail(`${label}: "${field}" is not a known category.`);
  }
}

function validateSetting(c: Checker, row: Row, label: string): void {
  const key = row.key;
  const value = row.value;
  if (
    typeof key !== "string" ||
    !(BACKUP_SETTING_KEYS as readonly string[]).includes(key)
  ) {
    c.fail(`${label}: unknown preference.`);
    return;
  }
  if (typeof value !== "string" || value.length > 100) {
    c.fail(`${label}: "${key}" has an invalid value.`);
    return;
  }
  if (key === "user_name" && value.length > 30)
    c.fail(`${label}: the name is too long.`);
  if (key.endsWith("_time") && !TIME.test(value))
    c.fail(`${label}: "${key}" is not a valid time.`);
  if (key.endsWith("_enabled") && value !== "0" && value !== "1")
    c.fail(`${label}: "${key}" must be on or off.`);
  if (
    key === "theme_mode" &&
    value !== "light" &&
    value !== "dark" &&
    value !== "system"
  ) {
    c.fail(`${label}: unknown theme.`);
  }
}

/** Each row is checked with the same rules the app itself applies when you create things. */
function validateTables(c: Checker, data: BackupData): void {
  const each = (table: TableName, fn: (row: Row, label: string) => void) =>
    data[table].forEach((row, i) => fn(row, `${table} #${i + 1}`));
  const once = (seen: Set<string>, key: string | null, label: string) => {
    if (key === null) return;
    if (seen.has(key)) c.fail(`${label}: appears more than once.`);
    seen.add(key);
  };

  const settingKeys = new Set<string>();
  each("settings", (r, l) => {
    validateSetting(c, r, l);
    once(settingKeys, typeof r.key === "string" ? r.key : null, l);
  });

  const focusIds = new Set<string>();
  each("focus_areas", (r, l) => {
    const value = r.id;
    if (typeof value !== "string" || !FOCUS_AREA_IDS.has(value))
      c.fail(`${l}: unknown focus area.`);
    else once(focusIds, value, l);
  });

  const goalIds = new Set<string>();
  each("goals", (r, l) => {
    once(goalIds, c.id(r, "id", l), l);
    c.text(r, "title", l, 100, true);
    c.text(r, "description", l, 500, false);
    c.category(r, "category", l);
    const type = r.goal_type;
    if (
      type !== null &&
      type !== undefined &&
      (typeof type !== "string" || !isGoalType(type))
    ) {
      c.fail(`${l}: "goal_type" has an unknown value.`);
    }
    c.oneOf(r, "status", l, ["active", "completed", "archived"], true);
    c.date(r, "start_date", l, true);
    c.date(r, "target_date", l, false);
    c.text(r, "completion_criteria", l, 300, false);
    c.stamp(r, "completed_at", l, false);
    c.stamp(r, "created_at", l, true);
    c.stamp(r, "updated_at", l, true);
  });

  const milestoneIds = new Set<string>();
  each("milestones", (r, l) => {
    once(milestoneIds, c.id(r, "id", l), l);
    c.id(r, "goal_id", l);
    c.text(r, "title", l, 120, true);
    c.int(r, "position", l, 0, 1_000_000);
    c.stamp(r, "completed_at", l, false);
    c.stamp(r, "created_at", l, true);
  });

  const stepIds = new Set<string>();
  each("goal_steps", (r, l) => {
    once(stepIds, c.id(r, "id", l), l);
    c.id(r, "goal_id", l);
    c.id(r, "milestone_id", l, false);
    c.text(r, "title", l, 120, true);
    c.text(r, "notes", l, 500, false);
    c.date(r, "due_date", l, false);
    c.date(r, "scheduled_date", l, false);
    c.time(r, "scheduled_time", l, false);
    c.int(r, "reminder_enabled", l, 0, 1);
    c.int(r, "position", l, 0, 1_000_000);
    c.stamp(r, "completed_at", l, false);
    c.stamp(r, "created_at", l, true);
  });

  const habitIds = new Set<string>();
  each("habits", (r, l) => {
    once(habitIds, c.id(r, "id", l), l);
    c.text(r, "name", l, 60, true);
    c.text(r, "description", l, 300, false);
    c.category(r, "category", l);
    c.oneOf(r, "status", l, ["active", "archived"], true);
    c.date(r, "start_date", l, true);
    c.text(r, "minimum_label", l, 80, false);
    c.text(r, "target_label", l, 80, false);
    c.time(r, "reminder_time", l, false);
    c.int(r, "reminders_enabled", l, 0, 1);
    c.stamp(r, "archived_at", l, false);
    c.stamp(r, "created_at", l, true);
    c.stamp(r, "updated_at", l, true);
  });

  const scheduleKeys = new Set<string>();
  each("habit_schedules", (r, l) => {
    const habit = c.id(r, "habit_id", l);
    const weekday = c.int(r, "weekday", l, 0, 6);
    if (habit !== null && weekday !== null)
      once(scheduleKeys, `${habit}:${weekday}`, l);
  });

  const completionIds = new Set<string>();
  const completionKeys = new Set<string>();
  each("habit_completions", (r, l) => {
    once(completionIds, c.id(r, "id", l), l);
    const habit = c.id(r, "habit_id", l);
    const date = c.date(r, "date", l, true);
    c.oneOf(r, "level", l, ["minimum", "target"], true);
    c.stamp(r, "completed_at", l, true);
    if (habit !== null && date !== null)
      once(completionKeys, `${habit}:${date}`, l);
  });

  const taskIds = new Set<string>();
  each("tasks", (r, l) => {
    once(taskIds, c.id(r, "id", l), l);
    c.text(r, "title", l, 120, true);
    c.text(r, "description", l, 500, false);
    c.date(r, "date", l, true);
    c.time(r, "time", l, false);
    c.int(r, "reminder_enabled", l, 0, 1);
    c.oneOf(r, "status", l, ["pending", "done"], true);
    c.stamp(r, "completed_at", l, false);
    c.id(r, "goal_id", l, false);
    c.id(r, "habit_id", l, false);
    c.int(r, "postponed_count", l, 0, 1_000_000);
    c.stamp(r, "created_at", l, true);
    c.stamp(r, "updated_at", l, true);
  });

  const reflectionDates = new Set<string>();
  each("reflections", (r, l) => {
    once(reflectionDates, c.date(r, "date", l, true), l);
    c.text(r, "went_well", l, 1000, false);
    c.text(r, "struggled", l, 1000, false);
    c.text(r, "learned", l, 1000, false);
    c.text(r, "improve_tomorrow", l, 1000, false);
    c.stamp(r, "updated_at", l, true);
  });

  const reviewWeeks = new Set<string>();
  each("weekly_reviews", (r, l) => {
    const week = c.date(r, "week_start", l, true);
    if (week !== null && startOfWeek(week) !== week)
      c.fail(`${l}: the week does not start on a Monday.`);
    once(reviewWeeks, week, l);
    c.text(r, "notes", l, 1000, false);
    c.text(r, "next_priorities", l, 300, false);
    c.stamp(r, "completed_at", l, true);
  });

  const ruleIds = new Set<string>();
  each("personal_rules", (r, l) => {
    once(ruleIds, c.id(r, "id", l), l);
    c.text(r, "text", l, 200, true);
    c.int(r, "position", l, 0, 1_000_000);
    c.stamp(r, "created_at", l, true);
  });

  const celebrationIds = new Set<string>();
  const celebrationKeys = new Set<string>();
  each("celebrations", (r, l) => {
    once(celebrationIds, c.text(r, "id", l, 300, true), l);
    const kind = c.oneOf(
      r,
      "kind",
      l,
      ["daily", "goal", "milestone", "streak", "review"],
      true,
    );
    const ref = c.text(r, "ref_id", l, 200, true);
    c.stamp(r, "shown_at", l, true);
    if (kind !== null && ref !== null)
      once(celebrationKeys, `${kind}:${ref}`, l);
  });
}

/** Every link between records must resolve, so a restore can never leave dangling references. */
function crossCheck(c: Checker, data: BackupData): void {
  const goalIds = new Set(data.goals.map((g) => String(g.id)));
  const habitIds = new Set(data.habits.map((h) => String(h.id)));
  const milestoneGoal = new Map(
    data.milestones.map((m) => [String(m.id), String(m.goal_id)]),
  );

  data.milestones.forEach((m, i) => {
    if (!goalIds.has(String(m.goal_id)))
      c.fail(
        `milestones #${i + 1}: belongs to a goal that is not in the backup.`,
      );
  });

  data.goal_steps.forEach((s, i) => {
    const label = `goal_steps #${i + 1}`;
    if (!goalIds.has(String(s.goal_id)))
      c.fail(`${label}: belongs to a goal that is not in the backup.`);
    if (s.milestone_id !== null && s.milestone_id !== undefined) {
      const owner = milestoneGoal.get(String(s.milestone_id));
      if (owner === undefined)
        c.fail(`${label}: belongs to a milestone that is not in the backup.`);
      else if (owner !== String(s.goal_id))
        c.fail(`${label}: its milestone belongs to a different goal.`);
    }
  });

  data.habit_schedules.forEach((s, i) => {
    if (!habitIds.has(String(s.habit_id)))
      c.fail(
        `habit_schedules #${i + 1}: belongs to a habit that is not in the backup.`,
      );
  });
  data.habit_completions.forEach((s, i) => {
    if (!habitIds.has(String(s.habit_id)))
      c.fail(
        `habit_completions #${i + 1}: belongs to a habit that is not in the backup.`,
      );
  });

  data.tasks.forEach((t, i) => {
    if (
      t.goal_id !== null &&
      t.goal_id !== undefined &&
      !goalIds.has(String(t.goal_id))
    ) {
      c.fail(`tasks #${i + 1}: linked to a goal that is not in the backup.`);
    }
    if (
      t.habit_id !== null &&
      t.habit_id !== undefined &&
      !habitIds.has(String(t.habit_id))
    ) {
      c.fail(`tasks #${i + 1}: linked to a habit that is not in the backup.`);
    }
  });

  // Habits without a schedule would never appear anywhere.
  const scheduled = new Set(
    data.habit_schedules.map((s) => String(s.habit_id)),
  );
  data.habits.forEach((h, i) => {
    if (!scheduled.has(String(h.id)))
      c.fail(`habits #${i + 1}: has no scheduled days.`);
  });
}

function summarize(
  data: BackupData,
  exportedAt: string,
  appVersion: string,
): BackupSummary {
  const flag = (key: string) =>
    data.settings.some((s) => s.key === key && s.value === "1");
  return {
    exportedAt,
    appVersion,
    goals: data.goals.length,
    activeGoals: data.goals.filter((g) => g.status === "active").length,
    milestones: data.milestones.length,
    steps: data.goal_steps.length,
    habits: data.habits.length,
    activeHabits: data.habits.filter((h) => h.status === "active").length,
    completions: data.habit_completions.length,
    tasks: data.tasks.length,
    reflections: data.reflections.length,
    reviews: data.weekly_reviews.length,
    rules: data.personal_rules.length,
    hasReminders:
      flag("planning_reminder_enabled") ||
      flag("reflection_reminder_enabled") ||
      data.habits.some((h) => h.reminders_enabled === 1) ||
      data.tasks.some((t) => t.reminder_enabled === 1) ||
      data.goal_steps.some((s) => s.reminder_enabled === 1),
  };
}

const invalid = (errors: string[]): ValidationResult => ({
  ok: false,
  kind: "invalid",
  errors,
});

function finish(c: Checker): ValidationResult {
  const errors = [...c.errors];
  if (c.count > errors.length)
    errors.push(`And ${c.count - errors.length} more problems.`);
  return invalid(errors);
}

/**
 * Checks structure, version, every field and every link between records. Pure: it changes nothing.
 * An older schema would be upgraded here before the checks. Schema 1 and 2 have the same backed up
 * tables, so nothing needs converting yet.
 */
export function validateBackup(input: unknown): ValidationResult {
  if (!isRecord(input) || input.app !== BACKUP_APP)
    return invalid(["This file is not a Gritio backup."]);

  const { format, schemaVersion } = input;
  if (
    typeof format !== "number" ||
    typeof schemaVersion !== "number" ||
    !Number.isInteger(format) ||
    !Number.isInteger(schemaVersion) ||
    format < 1 ||
    schemaVersion < 1
  ) {
    return invalid(["This backup has an unreadable version."]);
  }
  if (format > BACKUP_FORMAT || schemaVersion > SCHEMA_VERSION) {
    return {
      ok: false,
      kind: "newer",
      errors: [
        "This backup was made by a newer version of Gritio. Update the app, then try again.",
      ],
    };
  }

  const exportedAt =
    typeof input.exportedAt === "string" &&
    !Number.isNaN(Date.parse(input.exportedAt))
      ? input.exportedAt
      : null;
  if (exportedAt === null) return invalid(["This backup has no valid date."]);
  const appVersion =
    typeof input.appVersion === "string"
      ? input.appVersion.slice(0, 20)
      : "unknown";
  if (!isRecord(input.data))
    return invalid(["This backup has no data section."]);

  const c = new Checker();
  const data = {} as BackupData;
  for (const table of Object.keys(TABLE_COLUMNS) as TableName[]) {
    const raw = input.data[table];
    if (!Array.isArray(raw)) {
      c.fail(`The "${table}" section is missing.`);
      data[table] = [];
      continue;
    }
    const rows: Row[] = [];
    raw.forEach((item, i) => {
      if (isRecord(item)) rows.push(item as Row);
      else c.fail(`${table} #${i + 1} is not a record.`);
    });
    data[table] = rows;
  }
  if (c.count > 0) return finish(c);

  validateTables(c, data);
  crossCheck(c, data);

  // Limits are never enforced by quietly dropping records, so a backup over a limit is refused.
  const activeGoals = data.goals.filter((g) => g.status === "active").length;
  if (activeGoals > LIMITS.maxActiveGoals) {
    c.fail(
      `This backup has ${activeGoals} active goals, and Gritio allows ${LIMITS.maxActiveGoals} at a time.`,
    );
  }
  const activeHabits = data.habits.filter((h) => h.status === "active").length;
  if (activeHabits > LIMITS.maxActiveHabits) {
    c.fail(
      `This backup has ${activeHabits} active habits, and Gritio allows ${LIMITS.maxActiveHabits} at a time.`,
    );
  }

  if (c.count > 0) return finish(c);

  return {
    ok: true,
    backup: {
      app: BACKUP_APP,
      format,
      schemaVersion,
      exportedAt,
      appVersion,
      data,
    },
    summary: summarize(data, exportedAt, appVersion),
  };
}
