import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { runMigrations } from "./migrations";

const DB_NAME = "gritio.db";
let dbPromise: Promise<SQLiteDatabase> | null = null;

/** Single shared connection. Safe to call from anywhere, initializes once. */
export function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await openDatabaseAsync(DB_NAME);
      await db.execAsync("PRAGMA journal_mode = WAL;");
      await runMigrations(db);
      return db;
    })().catch((error) => {
      dbPromise = null; // allow retry after a failure
      throw error;
    });
  }
  return dbPromise;
}
