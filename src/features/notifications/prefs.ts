import { getDb } from "@/db/client";
import type { SettingKey } from "@/types/domain";

export type NotificationPrefs = {
  /** Master switch for every reminder. */
  masterEnabled: boolean;
  planningEnabled: boolean;
  planningTime: string;
  reflectionEnabled: boolean;
  reflectionTime: string;
  /** Global gate for habits that have reminders on. */
  habitRemindersEnabled: boolean;
  /** Global gate for tasks and goal steps that have reminders on. */
  taskRemindersEnabled: boolean;
};

const KEYS: SettingKey[] = [
  "notifications_enabled",
  "planning_reminder_enabled",
  "planning_time",
  "reflection_reminder_enabled",
  "reflection_time",
  "habit_reminders_enabled",
  "task_reminders_enabled",
];

export async function loadNotificationPrefs(): Promise<NotificationPrefs> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    `SELECT key, value FROM settings WHERE key IN (${KEYS.map(() => "?").join(",")})`,
    KEYS,
  );
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const flag = (key: SettingKey, fallback: boolean) =>
    map.has(key) ? map.get(key) === "1" : fallback;

  return {
    masterEnabled: flag("notifications_enabled", true),
    planningEnabled: flag("planning_reminder_enabled", false),
    planningTime: map.get("planning_time") ?? "07:00",
    reflectionEnabled: flag("reflection_reminder_enabled", false),
    reflectionTime: map.get("reflection_time") ?? "21:00",
    habitRemindersEnabled: flag("habit_reminders_enabled", true),
    taskRemindersEnabled: flag("task_reminders_enabled", true),
  };
}

const FIELD_KEYS: Record<keyof NotificationPrefs, SettingKey> = {
  masterEnabled: "notifications_enabled",
  planningEnabled: "planning_reminder_enabled",
  planningTime: "planning_time",
  reflectionEnabled: "reflection_reminder_enabled",
  reflectionTime: "reflection_time",
  habitRemindersEnabled: "habit_reminders_enabled",
  taskRemindersEnabled: "task_reminders_enabled",
};

/** Saves preference changes. The caller then asks the service to reconcile. */
export async function saveNotificationPrefs(
  patch: Partial<NotificationPrefs>,
): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const field of Object.keys(patch) as Array<keyof NotificationPrefs>) {
      const value = patch[field];
      if (value === undefined) continue;
      const stored = typeof value === "boolean" ? (value ? "1" : "0") : value;
      await db.runAsync(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        FIELD_KEYS[field],
        stored,
      );
    }
  });
}
