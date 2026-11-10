import { freshApp } from "../helpers/app";

describe("database migrations", () => {
  it("builds the whole schema at the latest version", async () => {
    const { db } = await freshApp();
    const version = await db.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version",
    );
    expect(version?.user_version).toBe(2);

    const tables = (
      await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table'",
      )
    ).map((t) => t.name);
    expect(tables).toEqual(
      expect.arrayContaining([
        "settings",
        "focus_areas",
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
        "scheduled_notifications",
        "inbox_notifications",
        "celebrations",
      ]),
    );
  });

  it("added the notification title and body columns in migration 2", async () => {
    const { db } = await freshApp();
    const columns = (
      await db.getAllAsync<{ name: string }>(
        "PRAGMA table_info(scheduled_notifications)",
      )
    ).map((c) => c.name);
    expect(columns).toEqual(expect.arrayContaining(["title", "body"]));
  });

  it("is safe to run again, changing nothing", async () => {
    const { db, migrations } = await freshApp();
    await migrations.runMigrations(db);
    const version = await db.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version",
    );
    expect(version?.user_version).toBe(2);
  });

  it("enforces foreign keys and constraints", async () => {
    const { db, habits } = await freshApp();
    const foreignKeys = await db.getFirstAsync<{ foreign_keys: number }>(
      "PRAGMA foreign_keys",
    );
    expect(foreignKeys?.foreign_keys).toBe(1);

    // A step cannot belong to a goal that does not exist.
    await expect(
      db.runAsync(
        "INSERT INTO goal_steps (id, goal_id, title, created_at) VALUES ('x', 'ghost', 't', '2026-01-01T00:00:00.000Z')",
      ),
    ).rejects.toBeTruthy();

    // A goal cannot have a made up status.
    await expect(
      db.runAsync(
        "INSERT INTO goals (id, title, status, start_date, created_at, updated_at) VALUES ('g', 't', 'banana', '2026-10-01', 'a', 'b')",
      ),
    ).rejects.toBeTruthy();

    // A habit can have only one completion per day, at the database level.
    const id = await habits.createHabit({
      name: "Read",
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      startDate: "2026-10-01",
    });
    const insert = (completionId: string) =>
      db.runAsync(
        "INSERT INTO habit_completions (id, habit_id, date, level, completed_at) VALUES (?, ?, '2026-10-05', 'target', '2026-10-05T08:00:00.000Z')",
        completionId,
        id,
      );
    await insert("c1");
    await expect(insert("c2")).rejects.toBeTruthy();
  });
});
