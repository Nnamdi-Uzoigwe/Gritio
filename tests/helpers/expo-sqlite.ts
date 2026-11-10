import type { Database, SqlJsStatic } from "sql.js";
import initSqlJs from "sql.js";

let engine: SqlJsStatic | null = null;

async function loadEngine(): Promise<SqlJsStatic> {
  if (!engine) engine = await initSqlJs();
  return engine;
}

type Bindable = string | number | null;

/** The app passes parameters either spread out or as one array, so accept both. */
function normalize(params: unknown[]): Bindable[] {
  const list =
    params.length === 1 && Array.isArray(params[0])
      ? (params[0] as unknown[])
      : params;
  return list.map((p) => (p === undefined ? null : (p as Bindable)));
}

/** Just enough of expo-sqlite's database API for the app's own code, backed by a real SQLite engine. */
class MockDatabase {
  private depth = 0;

  constructor(private readonly db: Database) {}

  async execAsync(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async runAsync(
    sql: string,
    ...params: unknown[]
  ): Promise<{ changes: number; lastInsertRowId: number }> {
    this.db.run(sql, normalize(params));
    return { changes: this.db.getRowsModified(), lastInsertRowId: 0 };
  }

  async getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]> {
    const statement = this.db.prepare(sql);
    try {
      statement.bind(normalize(params));
      const rows: T[] = [];
      while (statement.step()) rows.push(statement.getAsObject() as T);
      return rows;
    } finally {
      statement.free();
    }
  }

  async getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null> {
    const rows = await this.getAllAsync<T>(sql, ...params);
    return rows[0] ?? null;
  }

  /** Commits if the task finishes, rolls everything back if it throws. */
  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    if (this.depth > 0) {
      await task();
      return;
    }
    this.db.run("BEGIN");
    this.depth += 1;
    try {
      await task();
      this.db.run("COMMIT");
    } catch (error) {
      this.db.run("ROLLBACK");
      throw error;
    } finally {
      this.depth -= 1;
    }
  }
}

export async function openDatabaseAsync(_name: string): Promise<MockDatabase> {
  const sql = await loadEngine();
  return new MockDatabase(new sql.Database());
}
