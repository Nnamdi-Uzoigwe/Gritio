import { isFocusAreaId } from "@/lib/goalMeta";
import type { FocusAreaId } from "@/types/domain";
import { getDb } from "../client";

export async function getFocusAreaIds(): Promise<FocusAreaId[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string }>(
    "SELECT id FROM focus_areas",
  );
  return rows.map((r) => r.id).filter(isFocusAreaId);
}
