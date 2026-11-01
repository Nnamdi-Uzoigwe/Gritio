export const BACKUP_APP = "gritio";
export const BACKUP_FORMAT = 1;
/** The database schema version this build writes. It matches the last migration. */
export const SCHEMA_VERSION = 2;
export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;
export const BACKUP_FILE_PREFIX = "gritio-backup-";

export type Row = Record<string, string | number | null>;

/**
 * Exactly which columns of which tables go into a backup, in one place.
 * Export, validation and restore all read this list, so they can never drift apart.
 * Not included on purpose: scheduled notification records and the notification center log
 * (device specific, rebuilt on restore).
 */
export const TABLE_COLUMNS = {
  settings: ["key", "value"],
  focus_areas: ["id"],
  goals: [
    "id",
    "title",
    "description",
    "category",
    "goal_type",
    "status",
    "start_date",
    "target_date",
    "completion_criteria",
    "completed_at",
    "created_at",
    "updated_at",
  ],
  milestones: [
    "id",
    "goal_id",
    "title",
    "position",
    "completed_at",
    "created_at",
  ],
  goal_steps: [
    "id",
    "goal_id",
    "milestone_id",
    "title",
    "notes",
    "due_date",
    "scheduled_date",
    "scheduled_time",
    "reminder_enabled",
    "position",
    "completed_at",
    "created_at",
  ],
  habits: [
    "id",
    "name",
    "description",
    "category",
    "status",
    "start_date",
    "minimum_label",
    "target_label",
    "reminder_time",
    "reminders_enabled",
    "archived_at",
    "created_at",
    "updated_at",
  ],
  habit_schedules: ["habit_id", "weekday"],
  habit_completions: ["id", "habit_id", "date", "level", "completed_at"],
  tasks: [
    "id",
    "title",
    "description",
    "date",
    "time",
    "reminder_enabled",
    "status",
    "completed_at",
    "goal_id",
    "habit_id",
    "postponed_count",
    "created_at",
    "updated_at",
  ],
  reflections: [
    "date",
    "went_well",
    "struggled",
    "learned",
    "improve_tomorrow",
    "updated_at",
  ],
  weekly_reviews: ["week_start", "notes", "next_priorities", "completed_at"],
  personal_rules: ["id", "text", "position", "created_at"],
  celebrations: ["id", "kind", "ref_id", "shown_at"],
} as const;

export type TableName = keyof typeof TABLE_COLUMNS;
export type BackupData = Record<TableName, Row[]>;

export type BackupFile = {
  app: typeof BACKUP_APP;
  format: number;
  schemaVersion: number;
  exportedAt: string;
  appVersion: string;
  data: BackupData;
};

/**
 * Preferences that travel with a backup. App Lock is deliberately not here: it is a privacy choice
 * for one phone and should not follow a file onto another.
 */
export const BACKUP_SETTING_KEYS = [
  "user_name",
  "wake_time",
  "planning_time",
  "reflection_time",
  "planning_reminder_enabled",
  "reflection_reminder_enabled",
  "notifications_enabled",
  "habit_reminders_enabled",
  "task_reminders_enabled",
  "celebrations_enabled",
  "theme_mode",
] as const;

const pad = (n: number) => String(n).padStart(2, "0");

export function backupFileName(now: Date = new Date()): string {
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `${BACKUP_FILE_PREFIX}${date}-${pad(now.getHours())}${pad(now.getMinutes())}.json`;
}
