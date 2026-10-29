import { getDb } from "@/db/client";
import { requestReconcile } from "@/features/notifications/service";
import type { SettingKey } from "@/types/domain";
import type { SQLiteDatabase } from "expo-sqlite";
import type { OnboardingAnswers } from "./store";

async function put(
  db: SQLiteDatabase,
  key: SettingKey,
  value: string,
): Promise<void> {
  await db.runAsync(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    key,
    value,
  );
}

/** Saves every answer and the completion flag in one transaction. */
export async function completeOnboarding(
  answers: OnboardingAnswers,
): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const name = answers.name.trim();
    if (name) {
      await put(db, "user_name", name);
    } else {
      await db.runAsync("DELETE FROM settings WHERE key = ?", "user_name");
    }
    await put(db, "wake_time", answers.wakeTime);
    await put(db, "planning_time", answers.planningTime);
    await put(db, "reflection_time", answers.reflectionTime);
    await put(
      db,
      "planning_reminder_enabled",
      answers.planningReminder ? "1" : "0",
    );
    await put(
      db,
      "reflection_reminder_enabled",
      answers.reflectionReminder ? "1" : "0",
    );
    await db.runAsync("DELETE FROM focus_areas");
    for (const id of answers.focusAreas) {
      await db.runAsync("INSERT INTO focus_areas (id) VALUES (?)", id);
    }
    await put(db, "onboarding_completed", "1");
  });
  requestReconcile();
}
