import { getDb } from "@/db/client";
import Constants from "expo-constants";
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

/** Reads every backed up table inside one transaction, so the file is a consistent snapshot. */
export async function collectBackup(): Promise<BackupFile> {
  const db = await getDb();
  const data = {} as BackupData;

  await db.withTransactionAsync(async () => {
    for (const table of Object.keys(TABLE_COLUMNS) as TableName[]) {
      const columns = TABLE_COLUMNS[table].join(", ");
      if (table === "settings") {
        const marks = BACKUP_SETTING_KEYS.map(() => "?").join(", ");
        data[table] = await db.getAllAsync<Row>(
          `SELECT ${columns} FROM settings WHERE key IN (${marks})`,
          [...BACKUP_SETTING_KEYS],
        );
      } else {
        data[table] = await db.getAllAsync<Row>(
          `SELECT ${columns} FROM ${table}`,
        );
      }
    }
  });

  return {
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: Constants.expoConfig?.version ?? "unknown",
    data,
  };
}

export type StoredCounts = {
  goals: number;
  habits: number;
  tasks: number;
  reflections: number;
  completions: number;
};

export async function countStored(): Promise<StoredCounts> {
  const db = await getDb();
  const row = await db.getFirstAsync<StoredCounts>(
    `SELECT (SELECT COUNT(*) FROM goals) AS goals,
            (SELECT COUNT(*) FROM habits) AS habits,
            (SELECT COUNT(*) FROM tasks) AS tasks,
            (SELECT COUNT(*) FROM reflections) AS reflections,
            (SELECT COUNT(*) FROM habit_completions) AS completions`,
  );
  return (
    row ?? { goals: 0, habits: 0, tasks: 0, reflections: 0, completions: 0 }
  );
}
