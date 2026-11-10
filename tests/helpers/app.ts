/** Starts a brand new in-memory database with the real migrations and repositories on top of it. */
export async function freshApp() {
  jest.resetModules();

  const client =
    jest.requireActual<typeof import("@/db/client")>("@/db/client");
  const db = await client.getDb();

  return {
    db,
    migrations:
      jest.requireActual<typeof import("@/db/migrations")>("@/db/migrations"),
    goals: jest.requireActual<typeof import("@/db/repositories/goals")>(
      "@/db/repositories/goals",
    ),
    habits: jest.requireActual<typeof import("@/db/repositories/habits")>(
      "@/db/repositories/habits",
    ),
    steps: jest.requireActual<typeof import("@/db/repositories/steps")>(
      "@/db/repositories/steps",
    ),
    tasks: jest.requireActual<typeof import("@/db/repositories/tasks")>(
      "@/db/repositories/tasks",
    ),
    reviews: jest.requireActual<typeof import("@/db/repositories/reviews")>(
      "@/db/repositories/reviews",
    ),
    reflections: jest.requireActual<
      typeof import("@/db/repositories/reflections")
    >("@/db/repositories/reflections"),
    rules: jest.requireActual<typeof import("@/db/repositories/rules")>(
      "@/db/repositories/rules",
    ),
    settings: jest.requireActual<typeof import("@/db/repositories/settings")>(
      "@/db/repositories/settings",
    ),
    collect: jest.requireActual<typeof import("@/features/backup/collect")>(
      "@/features/backup/collect",
    ),
    restore: jest.requireActual<typeof import("@/features/backup/restore")>(
      "@/features/backup/restore",
    ),
    validate: jest.requireActual<typeof import("@/features/backup/validate")>(
      "@/features/backup/validate",
    ),
  };
}

export type App = Awaited<ReturnType<typeof freshApp>>;

export async function countRows(db: App["db"], table: string): Promise<number> {
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) AS c FROM ${table}`,
  );
  return row?.c ?? 0;
}
