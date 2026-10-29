import { getDb } from "../client";

export type InboxItem = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  refId: string | null;
  createdAt: string;
  read: boolean;
};

type Row = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  ref_id: string | null;
  created_at: string;
  read_at: string | null;
};

export async function listInbox(limit = 100): Promise<InboxItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    "SELECT id, kind, title, body, ref_id, created_at, read_at FROM inbox_notifications ORDER BY created_at DESC LIMIT ?",
    limit,
  );
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    body: r.body,
    refId: r.ref_id,
    createdAt: r.created_at,
    read: r.read_at !== null,
  }));
}

export async function countUnread(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) AS c FROM inbox_notifications WHERE read_at IS NULL",
  );
  return row?.c ?? 0;
}

export async function markRead(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE inbox_notifications SET read_at = ? WHERE id = ? AND read_at IS NULL",
    new Date().toISOString(),
    id,
  );
}

export async function markAllRead(): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE inbox_notifications SET read_at = ? WHERE read_at IS NULL",
    new Date().toISOString(),
  );
}

export async function deleteInboxItem(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM inbox_notifications WHERE id = ?", id);
}

export async function clearInbox(): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM inbox_notifications");
}
