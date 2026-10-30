import { nowIso } from "@/lib/dates";
import { newId } from "@/lib/ids";
import { runSerial } from "@/lib/serial";
import { ValidationError } from "@/lib/validation";
import { getDb } from "../client";

export type PersonalRule = { id: string; text: string; position: number };

function cleanText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) throw new ValidationError("Write your rule first.");
  if (trimmed.length > 200)
    throw new ValidationError("Rules can be up to 200 characters.");
  return trimmed;
}

export async function listRules(): Promise<PersonalRule[]> {
  const db = await getDb();
  return db.getAllAsync<PersonalRule>(
    "SELECT id, text, position FROM personal_rules ORDER BY position ASC, created_at ASC",
  );
}

export async function addRule(text: string): Promise<string> {
  const clean = cleanText(text);
  return runSerial(async () => {
    const db = await getDb();
    const id = newId();
    await db.runAsync(
      `INSERT INTO personal_rules (id, text, position, created_at)
       VALUES (?, ?, COALESCE((SELECT MAX(position) + 1 FROM personal_rules), 0), ?)`,
      id,
      clean,
      nowIso(),
    );
    return id;
  });
}

export async function updateRule(id: string, text: string): Promise<void> {
  const clean = cleanText(text);
  const db = await getDb();
  await db.runAsync(
    "UPDATE personal_rules SET text = ? WHERE id = ?",
    clean,
    id,
  );
}

export async function deleteRule(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM personal_rules WHERE id = ?", id);
}

export async function reorderRules(orderedIds: string[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.runAsync(
        "UPDATE personal_rules SET position = ? WHERE id = ?",
        i,
        orderedIds[i],
      );
    }
  });
}
