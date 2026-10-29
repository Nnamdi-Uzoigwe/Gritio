import type { SQLiteDatabase } from "expo-sqlite";

type Migration = { version: number; name: string; sql: string };

/**
 * Append new migrations to the end. Never edit a shipped migration.
 * user_version tracks the last applied one.
 */
const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: "initial schema",
    sql: `
      CREATE TABLE settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );

      CREATE TABLE focus_areas (
        id TEXT PRIMARY KEY NOT NULL
      );

      CREATE TABLE goals (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        goal_type TEXT,
        status TEXT NOT NULL DEFAULT 'active'
          CHECK (status IN ('active', 'completed', 'archived')),
        start_date TEXT NOT NULL,
        target_date TEXT,
        completion_criteria TEXT,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE milestones (
        id TEXT PRIMARY KEY NOT NULL,
        goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        completed_at TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE goal_steps (
        id TEXT PRIMARY KEY NOT NULL,
        goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
        milestone_id TEXT REFERENCES milestones(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        notes TEXT,
        due_date TEXT,
        scheduled_date TEXT,
        scheduled_time TEXT,
        reminder_enabled INTEGER NOT NULL DEFAULT 0,
        position INTEGER NOT NULL DEFAULT 0,
        completed_at TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE habits (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        status TEXT NOT NULL DEFAULT 'active'
          CHECK (status IN ('active', 'archived')),
        start_date TEXT NOT NULL,
        minimum_label TEXT,
        target_label TEXT,
        reminder_time TEXT,
        reminders_enabled INTEGER NOT NULL DEFAULT 0,
        archived_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE habit_schedules (
        habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
        PRIMARY KEY (habit_id, weekday)
      );

      CREATE TABLE habit_completions (
        id TEXT PRIMARY KEY NOT NULL,
        habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        level TEXT NOT NULL DEFAULT 'target'
          CHECK (level IN ('minimum', 'target')),
        completed_at TEXT NOT NULL,
        UNIQUE (habit_id, date)
      );

      CREATE TABLE tasks (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        time TEXT,
        reminder_enabled INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'done')),
        completed_at TEXT,
        goal_id TEXT REFERENCES goals(id) ON DELETE SET NULL,
        habit_id TEXT REFERENCES habits(id) ON DELETE SET NULL,
        postponed_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE reflections (
        date TEXT PRIMARY KEY NOT NULL,
        went_well TEXT,
        struggled TEXT,
        learned TEXT,
        improve_tomorrow TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE weekly_reviews (
        week_start TEXT PRIMARY KEY NOT NULL,
        notes TEXT,
        next_priorities TEXT,
        completed_at TEXT NOT NULL
      );

      CREATE TABLE personal_rules (
        id TEXT PRIMARY KEY NOT NULL,
        text TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE scheduled_notifications (
        id TEXT PRIMARY KEY NOT NULL,
        os_identifier TEXT,
        kind TEXT NOT NULL,
        ref_id TEXT,
        fire_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE inbox_notifications (
        id TEXT PRIMARY KEY NOT NULL,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        ref_id TEXT,
        created_at TEXT NOT NULL,
        read_at TEXT
      );

      CREATE TABLE celebrations (
        id TEXT PRIMARY KEY NOT NULL,
        kind TEXT NOT NULL,
        ref_id TEXT NOT NULL,
        shown_at TEXT NOT NULL,
        UNIQUE (kind, ref_id)
      );

      CREATE INDEX idx_goals_status ON goals(status);
      CREATE INDEX idx_milestones_goal ON milestones(goal_id, position);
      CREATE INDEX idx_steps_goal ON goal_steps(goal_id, position);
      CREATE INDEX idx_steps_scheduled ON goal_steps(scheduled_date);
      CREATE INDEX idx_habits_status ON habits(status);
      CREATE INDEX idx_completions_date ON habit_completions(date);
      CREATE INDEX idx_tasks_date ON tasks(date, status);
      CREATE INDEX idx_notifications_ref ON scheduled_notifications(kind, ref_id);
      CREATE INDEX idx_inbox_created ON inbox_notifications(created_at);
    `,
  },
  {
    version: 2,
    name: "notification titles and bodies",
    sql: `
      ALTER TABLE scheduled_notifications ADD COLUMN title TEXT;
      ALTER TABLE scheduled_notifications ADD COLUMN body TEXT;
    `,
  },
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // Must be set outside a transaction.
  await db.execAsync("PRAGMA foreign_keys = ON;");

  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  const current = row?.user_version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.sql);
      await db.execAsync(`PRAGMA user_version = ${migration.version};`);
    });
  }
}
