import { getDb } from "@/db/client";
import { runSerial } from "@/lib/serial";
import type { SQLiteDatabase } from "expo-sqlite";
import {
    BACKUP_SETTING_KEYS,
    TABLE_COLUMNS,
    type BackupFile,
    type Row,
    type TableName,
} from "./format";

/** Children before parents, so foreign keys are never violated while clearing. */
const CLEAR_ORDER = [
  "habit_completions",
  "habit_schedules",
  "tasks",
  "goal_steps",
  "milestones",
  "goals",
  "habits",
  "reflections",
  "weekly_reviews",
  "personal_rules",
  "celebrations",
  "focus_areas",
  // Device specific. Rebuilt by the reminder service after a restore.
  "scheduled_notifications",
  "inbox_notifications",
] as const;

/** Parents before children. */
const INSERT_ORDER: TableName[] = [
  "goals",
  "milestones",
  "goal_steps",
  "habits",
  "habit_schedules",
  "habit_completions",
  "tasks",
  "reflections",
  "weekly_reviews",
  "personal_rules",
  "celebrations",
  "focus_areas",
];

async function insertRows(
  db: SQLiteDatabase,
  table: TableName,
  rows: Row[],
): Promise<void> {
  const columns = TABLE_COLUMNS[table];
  const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`;
  for (const row of rows) {
    await db.runAsync(
      sql,
      columns.map((column) => row[column] ?? null),
    );
  }
}

/**
 * Replaces everything on this device with the backup, in one transaction.
 * If anything fails, the transaction rolls back and nothing at all has changed.
 * It writes straight to the tables, never through the app's own functions, so it triggers no
 * reminders and no celebrations by itself. The caller rebuilds reminders afterwards.
 * Must be called with an already validated backup.
 */
export function restoreBackup(backup: BackupFile): Promise<void> {
  return runSerial(async () => {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      for (const table of CLEAR_ORDER)
        await db.runAsync(`DELETE FROM ${table}`);

      const marks = BACKUP_SETTING_KEYS.map(() => "?").join(", ");
      await db.runAsync(`DELETE FROM settings WHERE key IN (${marks})`, [
        ...BACKUP_SETTING_KEYS,
      ]);

      await insertRows(db, "settings", backup.data.settings);
      for (const table of INSERT_ORDER)
        await insertRows(db, table, backup.data[table]);

      // There is data now, so onboarding must not start again.
      await db.runAsync(
        "INSERT INTO settings (key, value) VALUES ('onboarding_completed', '1') ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      );
    });
  });
}
