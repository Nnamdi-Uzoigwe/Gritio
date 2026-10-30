import type { ReflectionValues } from "@/features/reflections/prompts";
import { isValidDateKey, nowIso, toDateKey } from "@/lib/dates";
import { ValidationError } from "@/lib/validation";
import { getDb } from "../client";

export type Reflection = {
  date: string;
  values: ReflectionValues;
  updatedAt: string;
};

type Row = {
  date: string;
  went_well: string | null;
  struggled: string | null;
  learned: string | null;
  improve_tomorrow: string | null;
  updated_at: string;
};

function mapRow(r: Row): Reflection {
  return {
    date: r.date,
    updatedAt: r.updated_at,
    values: {
      wentWell: r.went_well ?? "",
      struggled: r.struggled ?? "",
      learned: r.learned ?? "",
      improveTomorrow: r.improve_tomorrow ?? "",
    },
  };
}

export async function getReflection(date: string): Promise<Reflection | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Row>(
    "SELECT * FROM reflections WHERE date = ?",
    date,
  );
  return row ? mapRow(row) : null;
}

export async function hasReflection(date: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) AS c FROM reflections WHERE date = ?",
    date,
  );
  return (row?.c ?? 0) > 0;
}

export async function listReflections(): Promise<Reflection[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    "SELECT * FROM reflections ORDER BY date DESC",
  );
  return rows.map(mapRow);
}

/**
 * Saves one day's reflection. If every answer is blank nothing is stored (and any old entry is removed),
 * so there are never empty records. Reflections stay on this device.
 */
export async function saveReflection(
  date: string,
  values: ReflectionValues,
): Promise<"saved" | "removed"> {
  if (!isValidDateKey(date)) throw new ValidationError("Choose a valid day.");
  if (date > toDateKey())
    throw new ValidationError(
      "You can only reflect on days that have started.",
    );

  const clean = (text: string): string | null => {
    const trimmed = text.trim();
    if (trimmed.length > 1000)
      throw new ValidationError("Each answer can be up to 1000 characters.");
    return trimmed || null;
  };
  const wentWell = clean(values.wentWell);
  const struggled = clean(values.struggled);
  const learned = clean(values.learned);
  const improveTomorrow = clean(values.improveTomorrow);

  const db = await getDb();
  if (!wentWell && !struggled && !learned && !improveTomorrow) {
    await db.runAsync("DELETE FROM reflections WHERE date = ?", date);
    return "removed";
  }

  await db.runAsync(
    `INSERT INTO reflections (date, went_well, struggled, learned, improve_tomorrow, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET went_well = excluded.went_well, struggled = excluded.struggled,
       learned = excluded.learned, improve_tomorrow = excluded.improve_tomorrow, updated_at = excluded.updated_at`,
    date,
    wentWell,
    struggled,
    learned,
    improveTomorrow,
    nowIso(),
  );
  return "saved";
}

export async function deleteReflection(date: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM reflections WHERE date = ?", date);
}
