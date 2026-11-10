import type { BackupFile } from "@/features/backup/format";

const TS = "2026-10-01T08:00:00.000Z";

/** A small but complete, valid backup that touches every table. Tests break it one way at a time. */
export function makeBackup(): BackupFile {
  return {
    app: "gritio",
    format: 1,
    schemaVersion: 2,
    exportedAt: "2026-11-01T10:00:00.000Z",
    appVersion: "1.0.0",
    data: {
      settings: [
        { key: "user_name", value: "Ada" },
        { key: "theme_mode", value: "dark" },
      ],
      focus_areas: [{ id: "learning" }],
      goals: [
        {
          id: "g1",
          title: "Learn TypeScript",
          description: null,
          category: "learning",
          goal_type: "outcome",
          status: "active",
          start_date: "2026-10-01",
          target_date: null,
          completion_criteria: null,
          completed_at: null,
          created_at: TS,
          updated_at: TS,
        },
      ],
      milestones: [
        {
          id: "m1",
          goal_id: "g1",
          title: "Basics",
          position: 0,
          completed_at: null,
          created_at: TS,
        },
      ],
      goal_steps: [
        {
          id: "s1",
          goal_id: "g1",
          milestone_id: "m1",
          title: "Learn types",
          notes: null,
          due_date: null,
          scheduled_date: "2026-11-02",
          scheduled_time: "09:00",
          reminder_enabled: 1,
          position: 0,
          completed_at: null,
          created_at: TS,
        },
      ],
      habits: [
        {
          id: "h1",
          name: "Read",
          description: null,
          category: null,
          status: "active",
          start_date: "2026-10-01",
          minimum_label: "2 pages",
          target_label: "20 pages",
          reminder_time: "07:00",
          reminders_enabled: 1,
          archived_at: null,
          created_at: TS,
          updated_at: TS,
        },
      ],
      habit_schedules: [
        { habit_id: "h1", weekday: 1 },
        { habit_id: "h1", weekday: 2 },
      ],
      habit_completions: [
        {
          id: "c1",
          habit_id: "h1",
          date: "2026-10-05",
          level: "target",
          completed_at: TS,
        },
      ],
      tasks: [
        {
          id: "t1",
          title: "Buy milk",
          description: null,
          date: "2026-11-02",
          time: null,
          reminder_enabled: 0,
          status: "pending",
          completed_at: null,
          goal_id: "g1",
          habit_id: null,
          postponed_count: 0,
          created_at: TS,
          updated_at: TS,
        },
      ],
      reflections: [
        {
          date: "2026-10-05",
          went_well: "A good day",
          struggled: null,
          learned: null,
          improve_tomorrow: null,
          updated_at: TS,
        },
      ],
      weekly_reviews: [
        {
          week_start: "2026-10-05",
          notes: null,
          next_priorities: "Ship it",
          completed_at: TS,
        },
      ],
      personal_rules: [
        { id: "r1", text: "Plan tomorrow", position: 0, created_at: TS },
      ],
      celebrations: [
        {
          id: "daily:2026-10-05",
          kind: "daily",
          ref_id: "2026-10-05",
          shown_at: TS,
        },
      ],
    },
  };
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Sorts rows and keys so two snapshots can be compared regardless of row order. */
export function normalizeData(
  data: BackupFile["data"],
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [table, rows] of Object.entries(data)) {
    out[table] = rows
      .map((row) => JSON.stringify(row, Object.keys(row).sort()))
      .sort();
  }
  return out;
}
